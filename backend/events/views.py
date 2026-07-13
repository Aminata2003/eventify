from datetime import date, datetime, timedelta
from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.mail import send_mail
from django.db import IntegrityError
from django.db.models import Count, Q, Sum
from rest_framework import status, viewsets, permissions
from rest_framework.decorators import action
from rest_framework.exceptions import NotAuthenticated, ValidationError, PermissionDenied
from rest_framework.permissions import AllowAny, IsAuthenticated, IsAuthenticatedOrReadOnly
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView

from .models import Event, Registration, Payment, Review
from .notifications import (
    send_registration_notifications,
    send_cancellation_notification_to_organizer,
    send_waitlist_notification,
    send_waitlist_available_notification,
)
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


def is_user_allowed_for_private_event(event, user):
    """Return whether an invited participant may access a private event."""
    if event.is_public or event.organizer_id == user.id:
        return True
    allowed_emails = {
        str(email).strip().lower()
        for email in (event.allowed_users or [])
        if email
    }
    return (user.email or "").strip().lower() in allowed_emails


class IsOrganizerOrReadOnly(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return request.user and request.user.is_authenticated and request.user.role == "organizer"

    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        return obj.organizer == request.user


class IsOrganizer(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.role == "organizer"


def notify_next_on_waitlist(event, count=1):
    # Trouver les premières personnes en liste d'attente
    waitlist = Registration.objects.filter(event=event, status="waitlist").order_by("registered_at")[:count]
    for reg in waitlist:
        send_waitlist_available_notification(event, reg.participant)


def cleanup_expired_pending_registrations(event):
    from django.utils import timezone
    from datetime import timedelta
    cutoff = timezone.now() - timedelta(minutes=15)
    expired_regs = Registration.objects.filter(
        event=event,
        status="pending",
        registered_at__lt=cutoff
    )
    count = expired_regs.count()
    if count > 0:
        expired_regs.delete()
        notify_next_on_waitlist(event, count=count)



class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_permissions(self):
        if self.action == "search":
            return [IsOrganizer()]
        if self.action == "me":
            return [IsAuthenticated()]
        return [IsAuthenticated()]

    def list(self, request, *args, **kwargs):
        raise PermissionDenied("Accès non autorisé.")

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        if instance != request.user:
            raise PermissionDenied("Vous ne pouvez consulter que votre propre profil.")
        return super().retrieve(request, *args, **kwargs)

    @action(detail=False, methods=["get"], permission_classes=[IsAuthenticated])
    def me(self, request):
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)

    @action(detail=False, methods=["get"], permission_classes=[IsAuthenticated])
    def search(self, request):
        """Recherche d'utilisateurs par email ou nom — pour les invitations privées."""
        q = request.query_params.get("q", "").strip()
        if not q or len(q) < 2:
            return Response([])
        users = (
            User.objects.filter(
                Q(email__icontains=q) | Q(first_name__icontains=q) | Q(last_name__icontains=q)
            )
            .exclude(id=request.user.id)
            .order_by("email")[:15]
        )
        return Response(UserSerializer(users, many=True).data)


class EventViewSet(viewsets.ModelViewSet):
    # prefetch_related pour éviter les N+1 sur les compteurs
    queryset = (
        Event.objects.select_related("organizer")
        .prefetch_related("registrations", "registrations__participant")
        .order_by("-created_at")
    )
    serializer_class = EventSerializer
    permission_classes = [IsAuthenticatedOrReadOnly, IsOrganizerOrReadOnly]
    filterset_class = EventFilter

    def get_queryset(self):
        """Bug I corrigé : les événements draft/cancelled sont masqués du public.
        Un organisateur voit tous ses événements. Un participant voit aussi
        les événements auxquels il est inscrit (pour accès à l'historique).
        """
        base = (
            Event.objects.select_related("organizer")
            .prefetch_related("registrations", "registrations__participant")
            .order_by("-created_at")
        )
        user = self.request.user
        if user and user.is_authenticated:
            invited_event_ids = [
                event.id
                for event in Event.objects.filter(status="published", is_public=False).only("id", "allowed_users")
                if is_user_allowed_for_private_event(event, user)
            ]
            return base.filter(
                Q(status="published", is_public=True)
                | Q(organizer=user)
                | Q(registrations__participant=user)
                | Q(pk__in=invited_event_ids)
            ).distinct()
        return base.filter(status="published", is_public=True)

    def get_serializer_class(self):
        if self.action in {"create", "update", "partial_update"}:
            return EventCreateSerializer
        return EventSerializer

    def perform_create(self, serializer):
        if not self.request.user or self.request.user.is_anonymous:
            raise NotAuthenticated("Authentication credentials were not provided.")
        serializer.save(organizer=self.request.user)

    def perform_update(self, serializer):
        instance = serializer.instance
        old_date = instance.date
        old_time = instance.time
        old_location = instance.location
        old_venue = instance.venue
        old_status = instance.status
        old_places = instance.places

        event = serializer.save()

        # Check changes for notification
        changes = []
        if old_date != event.date:
            changes.append(f"- Date : {old_date.strftime('%d/%m/%Y')} -> {event.date.strftime('%d/%m/%Y')}")
        if old_time != event.time:
            old_time_str = old_time.strftime('%H:%M') if old_time else "Non spécifié"
            new_time_str = event.time.strftime('%H:%M') if event.time else "Non spécifié"
            changes.append(f"- Heure : {old_time_str} -> {new_time_str}")
        if old_location != event.location:
            changes.append(f"- Lieu : {old_location} -> {event.location}")
        if old_venue != event.venue:
            changes.append(f"- Lieu exact : {old_venue or 'Non spécifié'} -> {event.venue or 'Non spécifié'}")

        from .notifications import send_event_cancelled_notification, send_event_modified_notification

        # If status changed to cancelled:
        if old_status != "cancelled" and event.status == "cancelled":
            confirmed_participants = [r.participant for r in event.registrations.filter(status="confirmed")]
            if confirmed_participants:
                send_event_cancelled_notification(event, confirmed_participants)
        elif changes:
            confirmed_participants = [r.participant for r in event.registrations.filter(status="confirmed")]
            if confirmed_participants:
                changes_desc = "\n".join(changes)
                send_event_modified_notification(event, confirmed_participants, changes_desc)

        # If capacity increased, notify next waitlisted participants
        if event.places > old_places:
            confirmed_count = event.registrations.filter(status="confirmed").count()
            free_slots = event.places - confirmed_count
            if free_slots > 0:
                notify_next_on_waitlist(event, count=free_slots)

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

    @action(detail=True, methods=["get"], permission_classes=[IsAuthenticated])
    def participants(self, request, pk=None):
        event = self.get_object()
        if event.organizer != request.user:
            raise PermissionDenied("Vous n'avez pas l'autorisation d'accéder à la liste des participants de cet événement.")
        registrations = event.registrations.select_related("participant")
        serializer = RegistrationSerializer(registrations, many=True)
        return Response(serializer.data)


class RegistrationViewSet(viewsets.ModelViewSet):
    queryset = Registration.objects.select_related("event", "participant").all()
    serializer_class = RegistrationSerializer
    permission_classes = [IsAuthenticated]

    @action(detail=False, methods=["post"], permission_classes=[IsAuthenticated])
    def register(self, request, event_id=None):
        try:
            event = Event.objects.get(pk=event_id)
        except Event.DoesNotExist:
            raise ValidationError({"detail": "Événement introuvable."})

        participant = request.user

        if not is_user_allowed_for_private_event(event, participant):
            raise PermissionDenied("Cet événement privé est réservé aux personnes invitées.")

        if participant.role != "participant":
            raise ValidationError({"detail": "Seuls les participants peuvent s'inscrire à une activité."})

        cleanup_expired_pending_registrations(event)

        # 1. L'organisateur ne peut pas participer à sa propre activité
        if participant == event.organizer:
            raise ValidationError({"detail": "Un organisateur ne peut pas participer à une activité qu'il a lui-même créée."})

        # 2. Une activité passée ne peut plus recevoir d'inscriptions
        from django.utils import timezone
        if event.date < timezone.now().date():
            raise ValidationError({"detail": "Une activité passée ne peut plus recevoir de nouvelles inscriptions."})

        # 3. L'activité doit être ouverte (pas annulée ni fermée)
        if event.status in ["cancelled", "closed"]:
            raise ValidationError({"detail": "Les inscriptions pour cette activité ne sont pas ouvertes ou l'activité a été annulée."})

        # 4. Ne pas pouvoir s'inscrire deux fois
        if Registration.objects.filter(event=event, participant=participant).exists():
            return Response({"detail": "Vous êtes déjà inscrit à cet événement (ou en liste d'attente)."}, status=status.HTTP_200_OK)

        # Un événement payant doit obligatoirement passer par la session de
        # paiement : le client ne peut pas confirmer une inscription seul.
        if event.price and event.price > 0:
            raise ValidationError({"detail": "Cet événement est payant. Veuillez utiliser le parcours de paiement."})

        # 5. Contrôle de capacité — Bug #2 corrigé : on compte confirmed + pending
        confirmed_count = event.registrations.filter(status="confirmed").count()
        pending_count = event.registrations.filter(status="pending").count()
        occupied = confirmed_count + pending_count
        is_full = (occupied >= event.places)

        if not is_full:
            serializer = RegisterEventSerializer(data=request.data, context={"request": request})
            serializer.is_valid(raise_exception=True)
            payment_method = serializer.validated_data.get("paymentMethod", "")
            if event.price and event.price > 0 and not payment_method:
                raise ValidationError({"paymentMethod": "Le mode de paiement est requis pour un événement payant."})

            registration = Registration.objects.create(event=event, participant=participant, status="confirmed")
            send_registration_notifications(event, participant, payment_method)
            return Response(
                {
                    "success": True,
                    "event_id": event.id,
                    "status": "confirmed",
                    "participant": participant.email,
                    "paymentMethod": payment_method,
                }
            )
        else:
            registration = Registration.objects.create(event=event, participant=participant, status="waitlist")
            send_waitlist_notification(event, participant)
            return Response(
                {
                    "success": True,
                    "event_id": event.id,
                    "status": "waitlist",
                    "participant": participant.email,
                    "detail": "L'activité est complète. Vous avez été ajouté à la liste d'attente."
                }
            )

    @action(detail=False, methods=["delete"], permission_classes=[IsAuthenticated])
    def cancel_registration(self, request, event_id=None):
        try:
            registration = Registration.objects.get(event_id=event_id, participant=request.user)
        except Registration.DoesNotExist:
            raise ValidationError({"detail": "Vous n'êtes pas inscrit à cet événement."})

        event = registration.event
        was_confirmed = (registration.status == "confirmed")

        # Notifier l'organisateur de l'annulation
        send_cancellation_notification_to_organizer(event, request.user)

        # Bug #4 corrigé : notifier le participant lui-même de la confirmation d'annulation
        from .notifications import send_participant_cancellation_confirmation
        send_participant_cancellation_confirmation(event, request.user)

        registration.delete()

        if was_confirmed:
            notify_next_on_waitlist(event, count=1)

        return Response({"success": True, "detail": "Votre inscription a bien été annulée."})

    @action(detail=True, methods=["post"], permission_classes=[IsAuthenticated])
    def confirm_waitlist(self, request, pk=None):
        registration = self.get_object()
        if registration.participant != request.user:
            raise ValidationError({"detail": "Vous ne pouvez pas confirmer cette inscription."})
        if registration.status != "waitlist":
            raise ValidationError({"detail": "Cette inscription n'est pas en liste d'attente."})

        event = registration.event
        confirmed_count = event.registrations.filter(status="confirmed").count()
        pending_count = event.registrations.filter(status="pending").count()
        free_spots = event.places - confirmed_count - pending_count

        if free_spots <= 0:
            raise ValidationError({"detail": "Désolé, il n'y a plus de place disponible pour le moment."})

        # Bug #9 corrigé : vérification FIFO — seul le premier en liste d'attente peut confirmer
        allowed_waitlist_ids = list(
            event.registrations.filter(status="waitlist")
            .order_by("registered_at")
            .values_list("participant_id", flat=True)[:free_spots]
        )
        if request.user.id not in allowed_waitlist_ids:
            raise ValidationError({"detail": "Ce n'est pas encore votre tour. Vous serez notifié par e-mail quand une place vous sera attribuée."})

        if event.price and event.price > 0:
            raise ValidationError({"detail": "Veuillez procéder au paiement pour confirmer votre inscription."})

        registration.status = "confirmed"
        registration.save()

        send_registration_notifications(event, request.user)
        return Response({"success": True, "detail": "Votre inscription a bien été confirmée !"})

    # Bug #3 corrigé : la route DELETE /registrations/<id>/ standard est désactivée
    # pour éviter la duplication avec cancel_registration.
    # Toute annulation doit passer par DELETE /events/<id>/cancel/
    def destroy(self, request, *args, **kwargs):
        raise PermissionDenied("Pour annuler une inscription, utilisez DELETE /events/<id>/cancel/")


class PaymentViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]

    def _get_participant(self, request, validated_data):
        if request.user and request.user.is_authenticated:
            return request.user
        raise NotAuthenticated("Authentication required.")

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

        participant = request.user

        if not is_user_allowed_for_private_event(event, participant):
            raise PermissionDenied("Cet événement privé est réservé aux personnes invitées.")

        if participant.role != "participant":
            raise ValidationError({"detail": "Seuls les participants peuvent effectuer un paiement pour une activité."})

        cleanup_expired_pending_registrations(event)

        # 1. L'organisateur ne peut pas participer à sa propre activité
        if participant == event.organizer:
            raise ValidationError({"detail": "Un organisateur ne peut pas participer à une activité qu'il a lui-même créée."})

        # 2. Une activité passée ne peut plus recevoir d'inscriptions
        from django.utils import timezone
        if event.date < timezone.now().date():
            raise ValidationError({"detail": "Une activité passée ne peut plus recevoir de nouvelles inscriptions."})

        # 3. L'activité doit être ouverte (pas annulée ni fermée)
        if event.status in ["cancelled", "closed"]:
            raise ValidationError({"detail": "Les inscriptions pour cette activité ne sont pas ouvertes ou l'activité a été annulée."})

        # 4. Contrôle de capacité et liste d'attente
        confirmed_count = event.registrations.filter(status="confirmed").count()
        pending_count = event.registrations.filter(status="pending").exclude(participant=participant).count()
        free_spots = event.places - confirmed_count

        user_reg = event.registrations.filter(participant=participant).first()

        if user_reg and user_reg.status == "waitlist":
            if free_spots <= 0:
                raise ValidationError({"detail": "L'activité est complète. Vous devez attendre qu'une place se libère."})

            allowed_waitlist_ids = list(
                event.registrations.filter(status="waitlist")
                .order_by("registered_at")
                .values_list("participant_id", flat=True)[:free_spots]
            )
            if participant.id not in allowed_waitlist_ids:
                raise ValidationError({"detail": "Ce n'est pas encore votre tour de confirmer et de payer."})
        else:
            has_waitlist = event.registrations.filter(status="waitlist").exists()
            if (confirmed_count + pending_count) >= event.places or has_waitlist:
                raise ValidationError({"detail": "L'activité est complète ou une liste d'attente est active. Veuillez vous inscrire sur la liste d'attente."})

        if not event.price or event.price <= 0:
            raise ValidationError({"eventId": "Cet événement n'est pas payant."})

        if provider not in ["card", "mobile_money"]:
            raise ValidationError({"provider": "Mode de paiement invalide."})

        if provider == "mobile_money" and not phone:
            raise ValidationError({"phone": "Le numéro mobile est requis pour le mobile money."})

        # Réserver le spot en mettant l'inscription à 'pending'
        registration, created = Registration.objects.get_or_create(
            event=event,
            participant=participant,
            defaults={"status": "pending"}
        )
        if not created:
            registration.status = "pending"
            from django.utils import timezone
            registration.registered_at = timezone.now()
            registration.save()

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
            payment = Payment.objects.get(
                session_id=session_id,
                status="pending",
                participant=request.user,
            )
        except Payment.DoesNotExist:
            raise ValidationError({"sessionId": "Session de paiement invalide ou déjà confirmée."})

        from django.utils import timezone
        if payment.created_at < timezone.now() - timedelta(minutes=15):
            payment.status = "failed"
            payment.save(update_fields=["status", "updated_at"])
            raise ValidationError({"sessionId": "Cette session de paiement a expiré. Veuillez recommencer le paiement."})

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
        if not created or registration.status != "confirmed":
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

        if not Registration.objects.filter(event=event, participant=request.user, status="confirmed").exists():
            raise ValidationError({"participant": "Vous devez être inscrit à cet événement avec un statut confirmé pour laisser un avis."})

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
        if request.data.get("role") == "organizer":
            raise ValidationError({"role": "Utilisez l'inscription organisateur pour créer ce type de compte."})
        payload = {**request.data, "role": "participant"}
        serializer = OrganizerRegisterSerializer(data=payload)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        user_data = UserSerializer(user).data
        return Response({"success": True, "user": user_data}, status=status.HTTP_201_CREATED)


class DashboardStatsViewSet(viewsets.ViewSet):

    permission_classes = [IsOrganizer]

    def list(self, request):
        from django.db.models import Sum, F, DecimalField, ExpressionWrapper

        events = Event.objects.filter(organizer=request.user)

        registrations = Registration.objects.filter(event__organizer=request.user)

        # Bug #8 corrigé : calcul du revenu par agrégation SQL au lieu d'une boucle Python N+1
        # On additionne price * nb_confirmed_registrations via annotation
        revenue_qs = (
            Event.objects.filter(organizer=request.user)
            .annotate(
                confirmed_count=Count(
                    "registrations",
                    filter=Q(registrations__status="confirmed")
                ),
                event_revenue=ExpressionWrapper(
                    F("price") * F("confirmed_count"),
                    output_field=DecimalField(max_digits=14, decimal_places=2),
                ),
            )
            .aggregate(total=Sum("event_revenue"))["total"]
        )

        # Bug #12 (dashboard) : page_views aussi agrégé en SQL
        page_views_total = events.aggregate(total=Sum("views_count"))["total"] or 0

        return Response({
            "total_events": events.count(),
            "registrations": registrations.count(),
            "confirmed": registrations.filter(status="confirmed").count(),
            "pending": registrations.filter(status="pending").count(),
            "waitlist": registrations.filter(status="waitlist").count(),
            "page_views": page_views_total,
            "revenue": revenue_qs or 0,
        })
