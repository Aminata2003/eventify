from datetime import timedelta

from django.core.management.base import BaseCommand
from django.db.models import Prefetch
from django.utils import timezone

from events.models import Event, Registration
from events.notifications import send_event_reminder_notification, send_event_organizer_reminder


class Command(BaseCommand):
    help = "Envoyer des rappels par email la veille des événements aux participants et aux organisateurs."

    def handle(self, *args, **options):
        tomorrow = timezone.localdate() + timedelta(days=1)
        events = Event.objects.filter(date=tomorrow).prefetch_related(
            Prefetch(
                "registrations",
                queryset=Registration.objects.filter(status="confirmed", reminder_sent=False).select_related("participant"),
                to_attr="pending_reminders",
            )
        )

        total_participant_emails = 0
        total_organizer_emails = 0

        for event in events:
            registrations = getattr(event, "pending_reminders", [])
            if not registrations:
                continue

            for registration in registrations:
                send_event_reminder_notification(registration)
                registration.reminder_sent = True
                registration.save(update_fields=["reminder_sent"])
                total_participant_emails += 1

            send_event_organizer_reminder(event, registrations)
            total_organizer_emails += 1

        self.stdout.write(self.style.SUCCESS(
            f"Rappels envoyés pour {len(events)} événement(s), {total_participant_emails} email(s) participant(s), {total_organizer_emails} email(s) organisateur(s)."
        ))
