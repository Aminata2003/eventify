from datetime import date, timedelta
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase
from django.contrib.auth import get_user_model
from events.models import Event, Payment, Registration

User = get_user_model()


class EventifySecurityTests(APITestCase):
    def setUp(self):
        # Create users
        self.organizer = User.objects.create_user(
            username="org@example.com",
            email="org@example.com",
            password="Aa123456Password",
            role="organizer"
        )
        self.organizer2 = User.objects.create_user(
            username="org2@example.com",
            email="org2@example.com",
            password="Aa123456Password",
            role="organizer"
        )
        self.participant = User.objects.create_user(
            username="part@example.com",
            email="part@example.com",
            password="Aa123456Password",
            role="participant"
        )

        # Create an event
        self.event = Event.objects.create(
            title="Event 1",
            description="Desc",
            category="Musique",
            date=date.today() + timedelta(days=5),
            location="Dakar",
            places=5,
            organizer=self.organizer,
            status="published"
        )

    def test_faille_1_participant_cannot_create_event(self):
        self.client.force_authenticate(user=self.participant)
        url = "/api/events/"
        data = {
            "title": "New Event",
            "category": "Musique",
            "date": str(date.today() + timedelta(days=10)),
            "location": "Dakar",
            "places": 100
        }
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_organizer_can_create_event(self):
        self.client.force_authenticate(user=self.organizer)
        url = "/api/events/"
        data = {
            "title": "New Event",
            "category": "Musique",
            "date": str(date.today() + timedelta(days=10)),
            "location": "Dakar",
            "places": 100
        }
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_faille_2_organizer_cannot_register_for_event(self):
        self.client.force_authenticate(user=self.organizer2)
        url = f"/api/events/{self.event.id}/register/"
        response = self.client.post(url, {})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("Seuls les participants peuvent", response.data["detail"])

    def test_participant_can_register_for_event(self):
        self.client.force_authenticate(user=self.participant)
        url = f"/api/events/{self.event.id}/register/"
        response = self.client.post(url, {})
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_paid_event_requires_payment_flow(self):
        self.event.price = 1000
        self.event.save()
        self.client.force_authenticate(user=self.participant)

        response = self.client.post(
            f"/api/events/{self.event.id}/register/",
            {"paymentMethod": "card"},
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(Registration.objects.filter(event=self.event, participant=self.participant).exists())

    def test_payment_confirmation_is_limited_to_owner(self):
        other_participant = User.objects.create_user(
            username="other@example.com",
            email="other@example.com",
            password="Aa123456Password",
            role="participant",
        )
        payment = Payment.objects.create(
            event=self.event,
            participant=self.participant,
            amount=1000,
            provider="card",
            reference="payment-owner-test",
            session_id="owner-session-test",
            status="pending",
        )
        self.client.force_authenticate(user=other_participant)

        response = self.client.post("/api/payments/confirm/", {"sessionId": payment.session_id})

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        payment.refresh_from_db()
        self.assertEqual(payment.status, "pending")

    def test_private_event_is_hidden_and_blocks_uninvited_participant(self):
        self.event.is_public = False
        self.event.allowed_users = []
        self.event.save()
        self.client.force_authenticate(user=self.participant)

        response = self.client.get("/api/events/")
        self.assertNotIn(self.event.id, [event["id"] for event in response.data])

        response = self.client.post(f"/api/events/{self.event.id}/register/", {})
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_faille_4_participant_cannot_access_dashboard_stats(self):
        self.client.force_authenticate(user=self.participant)
        url = "/api/dashboard/stats/"
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_organizer_can_access_dashboard_stats(self):
        self.client.force_authenticate(user=self.organizer)
        url = "/api/dashboard/stats/"
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_faille_b_participant_list_restricted_to_organizer(self):
        # Organizer 2 cannot access participants list of Organizer's event
        self.client.force_authenticate(user=self.organizer2)
        url = f"/api/events/{self.event.id}/participants/"
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

        # Organizer can access
        self.client.force_authenticate(user=self.organizer)
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_faille_3_cleanup_expired_pending_registrations(self):
        # Create a pending registration for another participant that is expired (16 minutes ago)
        expired_participant = User.objects.create_user(
            username="expired@example.com",
            email="expired@example.com",
            password="Aa123456Password",
            role="participant"
        )
        reg = Registration.objects.create(
            event=self.event,
            participant=expired_participant,
            status="pending"
        )
        # Manually alter registered_at to 20 minutes ago
        reg.registered_at = timezone.now() - timedelta(minutes=20)
        reg.save()

        # Place count of event is 5.
        # Now let's register the main participant. It should trigger cleanup, deleting the expired registration.
        self.client.force_authenticate(user=self.participant)
        url = f"/api/events/{self.event.id}/register/"
        response = self.client.post(url, {})
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Verify that the expired pending registration was deleted
        self.assertFalse(Registration.objects.filter(id=reg.id).exists())

    def test_review_restricted_to_confirmed_participants(self):
        # Create a past event
        past_event = Event.objects.create(
            title="Past Event",
            category="Musique",
            date=date.today() - timedelta(days=2),
            location="Dakar",
            places=5,
            organizer=self.organizer,
            status="published"
        )
        # Create a waitlist registration
        Registration.objects.create(
            event=past_event,
            participant=self.participant,
            status="waitlist"
        )
        self.client.force_authenticate(user=self.participant)
        url = f"/api/events/{past_event.id}/reviews/"
        response = self.client.post(url, {"rating": 5, "comment": "Nice"})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("statut confirmé", response.data["participant"])

        # Change status to confirmed
        reg = Registration.objects.get(event=past_event, participant=self.participant)
        reg.status = "confirmed"
        reg.save()

        response = self.client.post(url, {"rating": 5, "comment": "Nice"})
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_waitlist_to_pending_resets_timestamp(self):
        # Paid event
        paid_event = Event.objects.create(
            title="Paid Event",
            category="Musique",
            date=date.today() + timedelta(days=5),
            location="Dakar",
            places=5,
            price=1000,
            price_currency="FCFA",
            organizer=self.organizer,
            status="published"
        )
        # Create a waitlisted registration that joined 3 days ago
        reg = Registration.objects.create(
            event=paid_event,
            participant=self.participant,
            status="waitlist"
        )
        reg.registered_at = timezone.now() - timedelta(days=3)
        reg.save()

        # Initiate payment
        self.client.force_authenticate(user=self.participant)
        url = "/api/payments/initiate/"
        response = self.client.post(url, {"eventId": paid_event.id, "provider": "card"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Refresh registration from DB
        reg.refresh_from_db()
        self.assertEqual(reg.status, "pending")
        # Check that registered_at is very close to now (less than 5 seconds difference)
        self.assertLess((timezone.now() - reg.registered_at).total_seconds(), 5)
