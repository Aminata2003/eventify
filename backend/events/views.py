from datetime import date
from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.mail import send_mail
from django.db import IntegrityError
from django.db.models import Count, Q
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import NotAuthenticated, ValidationError
from rest_framework.permissions import AllowAny, IsAuthenticated, IsAuthenticatedOrReadOnly
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView

from .models import Event, Registration, Payment, Review
from .notifications import send_registration_notifications
from .filters import EventFilter
from .serializers import (
    EventCreateSerializer,
    EventSerializer,
    OrganizerRegisterSerializer,
    RegisterEventSerializer,
    RegistrationSerializer,
    UserSerializer,
    PaymentSerializer,
    ReviewSerializer,
)

import logging
import uuid
from decimal import Decimal

logger = logging.getLogger(__name__)

User = get_user_model()


class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [AllowAny]

    @action(detail=False, methods=["get"], permission_classes=[IsAuthenticated])
    def me(self, request):
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)


class EventViewSet(viewsets.ModelViewSet):
    queryset = Event.objects.select_related("organizer").order_by("-created_at")
    serializer_class = EventSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    filterset_class = EventFilter

    def get_serializer_class(self):
        if self.action in {"create", "update", "partial_update"}:
            return EventCreateSerializer
        return EventSerializer

    def perform_create(self, serializer):
        if not self.request.user or self.request.user.is_anonymous:
            raise NotAuthenticated("Authentication credentials were not provided.")
        serializer.save(organizer=self.request.user)

    def _get_or_create_default_organizer(self):
        user, _ = User.objects.get_or_create(
            username="organizer",
            defaults={"email": "organizer@eventify.dev", "role": "organizer"},
        )
        return user

   

    @action(detail=False, methods=["get"], permission_classes=[IsAuthenticated])
    def my_events(self, request):
        if not request.user or request.user.is_anonymous:
            raise NotAuthenticated("Authentication credentials were not provided.")
        queryset = self.get_queryset().filter(
            Q(organizer=request.user) | Q(registrations__participant=request.user)
        ).distinct()
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=["get"], permission_classes=[AllowAny])
    def participants(self, request, pk=None):
        event = self.get_object()
        registrations = event.registrations.select_related("participant")
        serializer = RegistrationSerializer(registrations, many=True)
        return Response(serializer.data)


class RegistrationViewSet(viewsets.ModelViewSet):
    queryset = Registration.objects.select_related("event", "participant").all()
    serializer_class = RegistrationSerializer
    permission_classes = [AllowAny]

    @action(detail=False, methods=["post"], permission_classes=[AllowAny])
    def register(self, request, event_id=None):
        serializer = RegisterEventSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        event = Event.objects.get(pk=event_id)

        payment_method = serializer.validated_data.get("paymentMethod", "")
        if event.price and event.price > 0 and not payment_method:
            raise ValidationError({"paymentMethod": "Le mode de paiement est requis pour un événement payant."})

        if request.user and request.user.is_authenticated:
            participant = request.user
        else:
            participant, _ = User.objects.get_or_create(
                username=serializer.validated_data["email"],
                defaults={
                    "email": serializer.validated_data["email"],
                    "first_name": serializer.validated_data["name"].split()[0],
                    "last_name": " ".join(serializer.validated_data["name"].split()[1:]),
                },
            )

        registration, created = Registration.objects.get_or_create(event=event, participant=participant)
        if not created:
            return Response({"detail": "Vous êtes déjà inscrit à cet événement."}, status=status.HTTP_200_OK)

        registration.status = "confirmed"
        registration.save()

        send_registration_notifications(event, participant, payment_method)

        return Response(
            {
                "success": True,
                "event_id": event.id,
                "participant": participant.email or serializer.validated_data.get("name", ""),
                "paymentMethod": payment_method,
            }
        )


class PaymentViewSet(viewsets.ViewSet):
    permission_classes = [AllowAny]

    def _get_participant(self, request, validated_data):
        if request.user and request.user.is_authenticated:
            return request.user

        email = validated_data.get("email")
        name = validated_data.get("name", "")
        if not email:
            raise ValidationError({"email": "L'email est requis pour créer la transaction."})

        participant, _ = User.objects.get_or_create(
            username=email,
            defaults={
                "email": email,
                "first_name": name.split()[0] if name else "",
                "last_name": " ".join(name.split()[1:]) if len(name.split()) > 1 else "",
            },
        )
        return participant

    def initiate(self, request):
        event_id = request.data.get("eventId") or request.data.get("event_id")
        provider = request.data.get("provider")
        payment_method = request.data.get("paymentMethod") or request.data.get("payment_method") or provider
        phone = request.data.get("phone", "")

        if not event_id:
            raise ValidationError({"eventId": "L'identifiant de l'événement est requis."})

        try:
            event = Event.objects.get(pk=event_id)
        except Event.DoesNotExist:
            raise ValidationError({"eventId": "Événement introuvable."})

        if not event.price or event.price <= 0:
            raise ValidationError({"eventId": "Cet événement n'est pas payant."})

        if provider not in ["card", "mobile_money"]:
            raise ValidationError({"provider": "Mode de paiement invalide."})

        if provider == "mobile_money" and not phone:
            raise ValidationError({"phone": "Le numéro mobile est requis pour le mobile money."})

        participant = self._get_participant(request, request.data)

        payment = Payment.objects.create(
            event=event,
            participant=participant,
            amount=event.price,
            currency=event.price_currency,
            provider=provider,
            payment_method=payment_method,
            phone=phone,
            reference=uuid.uuid4().hex[:16],
            session_id=uuid.uuid4().hex,
            status="pending",
        )

        if provider == "mobile_money":
            instructions = (
                f"Envoyez {event.price} {event.price_currency} au numéro Orange Money 77 123 45 67 ou Wave 78 123 45 67, "
                "puis cliquez sur 'J'ai payé' pour simuler la confirmation."
            )
        else:
            instructions = (
                f"Payer {event.price} {event.price_currency} avec une carte bancaire. "
                "Pour la démo, cliquez sur 'Simuler paiement'."
            )

        return Response(
            {
                "sessionId": payment.session_id,
                "paymentReference": payment.reference,
                "amount": str(payment.amount),
                "currency": payment.currency,
                "provider": provider,
                "instructions": instructions,
                "expiresIn": 900,
            }
        )

    def confirm(self, request):
        session_id = request.data.get("sessionId") or request.data.get("session_id")
        confirmation_code = request.data.get("confirmationCode", request.data.get("confirmation_code", ""))

        if not session_id:
            raise ValidationError({"sessionId": "L'identifiant de session est requis."})

        try:
            payment = Payment.objects.get(session_id=session_id, status="pending")
        except Payment.DoesNotExist:
            raise ValidationError({"sessionId": "Session de paiement invalide ou déjà confirmée."})

        payment.status = "completed"
        if isinstance(payment.metadata, dict):
            payment.metadata["confirmation_code"] = confirmation_code
        else:
            payment.metadata = {"confirmation_code": confirmation_code}
        payment.save()

        registration, created = Registration.objects.get_or_create(
            event=payment.event,
            participant=payment.participant,
            defaults={"status": "confirmed"},
        )
        if not created:
            registration.status = "confirmed"
            registration.save()

        try:
            send_registration_notifications(payment.event, payment.participant, payment.payment_method)
        except Exception as exc:
            logger.error("Erreur lors de l'envoi des notifications après confirmation du paiement : %s", exc)

        return Response(
            {
                "success": True,
                "event_id": payment.event.id,
                "sessionId": payment.session_id,
                "paymentStatus": payment.status,
                "registration": RegistrationSerializer(registration).data,
            }
        )


class OrganizerRegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        serializer = OrganizerRegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        user_data = UserSerializer(user).data
        return Response({"success": True, "user": user_data}, status=status.HTTP_201_CREATED)


class ReviewViewSet(viewsets.ModelViewSet):
    """List and create reviews for events. Listing is public, creating requires auth."""
    serializer_class = ReviewSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        event_id = self.kwargs.get("event_id") or self.request.query_params.get("event_id")
        qs = Review.objects.select_related("participant").all()
        if event_id:
            qs = qs.filter(event__id=event_id)
        return qs

    def create(self, request, *args, **kwargs):
        event_id = self.kwargs.get("event_id")
        try:
            event = Event.objects.get(pk=event_id)
        except Event.DoesNotExist:
            raise ValidationError({"event": "Événement introuvable."})

        if event.date > date.today():
            raise ValidationError({"event": "Vous pouvez laisser un avis uniquement après la tenue de l'événement."})

        if not request.user or request.user.is_anonymous:
            raise NotAuthenticated("Authentication credentials were not provided.")

        if not Registration.objects.filter(event=event, participant=request.user).exists():
            raise ValidationError({"participant": "Vous devez être inscrit à cet événement pour laisser un avis."})

        serializer = self.get_serializer(data=request.data, context={"request": request, "event": event})
        serializer.is_valid(raise_exception=True)
        try:
            self.perform_create(serializer)
        except Exception as exc:
            if "unique constraint" in str(exc).lower() or "unique_together" in str(exc).lower():
                raise ValidationError({"detail": "Vous avez déjà laissé un avis pour cet événement."})
            raise
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class UserRegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        payload = {**request.data, "role": request.data.get("role", "participant")}
        serializer = OrganizerRegisterSerializer(data=payload)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        user_data = UserSerializer(user).data
        return Response({"success": True, "user": user_data}, status=status.HTTP_201_CREATED)


class DashboardStatsViewSet(viewsets.ViewSet):

    permission_classes = [IsAuthenticated]


    def list(self, request):

        events = Event.objects.filter(
            organizer=request.user
        )


        registrations = Registration.objects.filter(
            event__organizer=request.user
        )



        return Response({

            "total_events": events.count(),


            "registrations": registrations.count(),


            "confirmed": registrations.filter(
                status="confirmed"
            ).count(),


            "pending": registrations.filter(
                status="pending"
            ).count(),


            "waitlist": registrations.filter(
                status="waitlist"
            ).count(),



            "page_views": sum(
                e.views_count for e in events
            ),



            "revenue": sum(
                e.price * e.registrations.filter(
                    status="confirmed"
                ).count()
                for e in events
            )

        })