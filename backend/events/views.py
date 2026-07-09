from django.contrib.auth import get_user_model
from django.db.models import Count, Q
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import NotAuthenticated
from rest_framework.permissions import AllowAny, IsAuthenticated, IsAuthenticatedOrReadOnly
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView

from .models import Event, Registration
from .serializers import (
    EventCreateSerializer,
    EventSerializer,
    OrganizerRegisterSerializer,
    RegisterEventSerializer,
    RegistrationSerializer,
    UserSerializer,
)

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

    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)

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
        event.registrations_count = event.registrations_count + 1
        event.save(update_fields=["registrations_count"])
        return Response({"success": True, "event_id": event.id, "participant": participant.email or serializer.validated_data.get("name", "")})


class OrganizerRegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        serializer = OrganizerRegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        user_data = UserSerializer(user).data
        return Response({"success": True, "user": user_data}, status=status.HTTP_201_CREATED)


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
    permission_classes = [AllowAny]

    def list(self, request):
        total_events = Event.objects.count()
        total_registrations = Registration.objects.count()
        return Response(
            {
                "total_events": total_events,
                "total_events_change": 12,
                "page_views": 3800,
                "page_views_change": 24,
                "registrations": total_registrations,
                "registrations_change": 8,
                "revenue": 4200000,
                "revenue_change": 15,
            }
        )