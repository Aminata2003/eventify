import re

import uuid

from django.contrib.auth import get_user_model
from django.core.files.base import ContentFile
from django.core.files.storage import default_storage
from rest_framework import serializers
from .models import Event, Registration, Payment, Review, Notification

User = get_user_model()


class ImageOrURLField(serializers.Field):
    def to_internal_value(self, data):
        if data is None or data == "":
            return ""

        if hasattr(data, "read"):
            return data

        return str(data)

    def to_representation(self, value):
        return value or ""


class UserSerializer(serializers.ModelSerializer):
    name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ["id", "username", "email", "role", "first_name", "last_name", "organization_name", "name"]

    def get_name(self, obj):
        return obj.get_full_name() or obj.username or obj.email or ""


class EventSerializer(serializers.ModelSerializer):

    organizer = UserSerializer(read_only=True)
    capacity = serializers.ReadOnlyField()
    allowed_users = serializers.SerializerMethodField()

    registrations_count = serializers.SerializerMethodField()
    confirmed_count = serializers.SerializerMethodField()
    pending_count = serializers.SerializerMethodField()
    waitlist_count = serializers.SerializerMethodField()
    user_registration_status = serializers.SerializerMethodField()
    user_registration_id = serializers.SerializerMethodField()
    is_favorite = serializers.SerializerMethodField()

    class Meta:
        model = Event

        fields = [
            "id",
            "title",
            "description",
            "category",
            "date",
            "time",
            "location",
            "venue",
            "image",
            "is_public",
            "allowed_users",
            "places",
            "capacity",
            "price",
            "price_currency",
            "organizer",
            "views_count",
            "registrations_count",
            "confirmed_count",
            "pending_count",
            "waitlist_count",
            "user_registration_status",
            "user_registration_id",
            "is_favorite",
            "status",
            "created_at",
            "updated_at",
        ]



    def get_registrations_count(self, obj):

        return obj.registrations.count()



    def get_confirmed_count(self, obj):

        return obj.registrations.filter(
            status="confirmed"
        ).count()



    def get_pending_count(self, obj):

        return obj.registrations.filter(
            status="pending"
        ).count()



    def get_waitlist_count(self, obj):

        return obj.registrations.filter(
            status="waitlist"
        ).count()

    def get_is_favorite(self, obj):
        request = self.context.get("request")
        if request and request.user and request.user.is_authenticated:
            return obj.favorited_by.filter(id=request.user.id).exists()
        return False

    def get_user_registration_status(self, obj):
        request = self.context.get("request")
        if request and request.user and not request.user.is_anonymous:
            reg = obj.registrations.filter(participant=request.user).first()
            if reg:
                return reg.status
        return None

    def get_user_registration_id(self, obj):
        request = self.context.get("request")
        if request and request.user and not request.user.is_anonymous:
            reg = obj.registrations.filter(participant=request.user).first()
            if reg:
                return reg.id
        return None

    def get_allowed_users(self, obj):
        """Only the event owner may see the complete invitation list."""
        request = self.context.get("request")
        if request and request.user and request.user.is_authenticated:
            if obj.organizer_id == request.user.id:
                return obj.allowed_users or []
        return []


class EventCreateSerializer(serializers.ModelSerializer):
    capacity = serializers.IntegerField(required=False, write_only=True, min_value=1)
    places = serializers.IntegerField(required=True, min_value=1)
    category = serializers.CharField(required=True, allow_blank=False)
    title = serializers.CharField(required=True, allow_blank=False)
    date = serializers.DateField(required=True)
    location = serializers.CharField(required=True, allow_blank=False)
    image = ImageOrURLField(required=False, allow_null=True)

    # Bug F corrigé : status accepté explicitement avec les seules valeurs métier autorisées
    status = serializers.ChoiceField(
        choices=["published", "draft", "cancelled"],
        required=False,
        default="published"
    )

    class Meta:
        model = Event
        fields = [
             "id",
            "title",
            "description",
            "category",
            "date",
            "time",
            "location",
            "venue",
            "image",
            "is_public",
            "allowed_users",
            "places",
            "capacity",
            "price",
            "price_currency",
            "status",
        ]

    def validate_date(self, value):
        from django.utils import timezone
        if not self.instance and value <= timezone.now().date():
            raise serializers.ValidationError("La date de début d'une activité doit être supérieure à la date actuelle lors de sa création.")
        return value

    def validate(self, attrs):
        request = self.context.get("request")
        if request and request.user and not request.user.is_anonymous:
            title = attrs.get("title")
            event_date = attrs.get("date")
            location = attrs.get("location")

            if self.instance:
                if title is None:
                    title = self.instance.title
                if event_date is None:
                    event_date = self.instance.date
                if location is None:
                    location = self.instance.location

            qs = Event.objects.filter(
                title=title,
                date=event_date,
                location=location,
                organizer=request.user
            )
            if self.instance:
                qs = qs.exclude(pk=self.instance.pk)
            if qs.exists():
                raise serializers.ValidationError("Un organisateur ne peut pas créer deux activités identiques ayant le même titre, la même date et le même lieu.")
        return attrs

    def _save_uploaded_image(self, image, request):
        if not image or not hasattr(image, "read"):
            return None

        filename = f"event_images/{uuid.uuid4().hex}_{image.name}"
        saved_path = default_storage.save(filename, ContentFile(image.read()))
        url = default_storage.url(saved_path)
        if request is not None:
            return request.build_absolute_uri(url)
        return url

    def create(self, validated_data):
        request = self.context.get("request")
        image = validated_data.get("image")
        if hasattr(image, "read"):
            validated_data["image"] = self._save_uploaded_image(image, request)

        capacity = validated_data.pop("capacity", None)
        if capacity is not None and "places" not in validated_data:
            validated_data["places"] = capacity
        return super().create(validated_data)

    def update(self, instance, validated_data):
        request = self.context.get("request")
        image = validated_data.get("image")
        if hasattr(image, "read"):
            validated_data["image"] = self._save_uploaded_image(image, request)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        return instance


class RegistrationSerializer(serializers.ModelSerializer):
    # Bug J corrigé : id est maintenant l'id de la Registration (pas du participant)
    participant_id = serializers.IntegerField(source="participant.id", read_only=True)
    name = serializers.SerializerMethodField()
    email = serializers.SerializerMethodField()
    registered_at = serializers.DateTimeField(read_only=True)

    class Meta:
        model = Registration
        fields = ["id", "participant_id", "name", "email", "registered_at", "status"]

    def get_name(self, obj):
        return obj.participant.get_full_name() or obj.participant.username or obj.participant.email or ""

    def get_email(self, obj):
        return obj.participant.email


class PaymentSerializer(serializers.ModelSerializer):
    event_title = serializers.CharField(source="event.title", read_only=True)
    participant_email = serializers.EmailField(source="participant.email", read_only=True)

    class Meta:
        model = Payment
        fields = [
            "id",
            "session_id",
            "reference",
            "status",
            "provider",
            "payment_method",
            "amount",
            "currency",
            "phone",
            "event_title",
            "participant_email",
            "created_at",
        ]


class ReviewSerializer(serializers.ModelSerializer):
    participant_name = serializers.SerializerMethodField(read_only=True)
    rating = serializers.IntegerField(min_value=1, max_value=5)

    class Meta:
        model = Review
        fields = ["id", "participant", "participant_name", "rating", "comment", "created_at"]
        read_only_fields = ["id", "participant", "participant_name", "created_at"]

    def get_participant_name(self, obj):
        return obj.participant.get_full_name() or obj.participant.username or obj.participant.email

    def create(self, validated_data):
        request = self.context.get("request")
        if not request or not request.user or request.user.is_anonymous:
            raise serializers.ValidationError("Authentication required to post a review.")
        validated_data["participant"] = request.user
        # event should be provided via context by the view
        event = self.context.get("event")
        if not event:
            raise serializers.ValidationError({"event": "Event context is required."})
        validated_data["event"] = event
        return super().create(validated_data)


class RegisterEventSerializer(serializers.Serializer):
    name = serializers.CharField(required=False, allow_blank=True)
    email = serializers.EmailField(required=False, allow_blank=True)
    paymentMethod = serializers.CharField(required=False, allow_blank=True)

    def validate(self, attrs):
        request = self.context.get("request")
        if not request or not request.user or request.user.is_anonymous:
            if not attrs.get("name"):
                raise serializers.ValidationError({"name": "Ce champ est requis pour les invités."})
            if not attrs.get("email"):
                raise serializers.ValidationError({"email": "Ce champ est requis pour les invités."})
        return attrs


class OrganizerRegisterSerializer(serializers.Serializer):
    name = serializers.CharField(required=True)
    email = serializers.EmailField(required=True)
    password = serializers.CharField(write_only=True, required=True)
    role = serializers.ChoiceField(choices=[("participant", "Participant"), ("organizer", "Organisateur")], default="participant")

    def validate_email(self, value):
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("Un compte avec cet email existe déjà.")
        return value

    def validate_password(self, value):
        # Au moins 6 caractères, une majuscule, une minuscule, un chiffre.
        if not re.match(r'^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{6,}$', value):
            raise serializers.ValidationError(
                "Le mot de passe doit contenir au moins 6 caractères, "
                "une majuscule, une minuscule et un chiffre."
            )
        return value

    def create(self, validated_data):
        name = validated_data["name"].strip()
        email = validated_data["email"].strip().lower()
        password = validated_data["password"]
        role = validated_data.get("role", "organizer")
        username = email
        first_name = name.split()[0] if name else ""
        last_name = " ".join(name.split()[1:]) if len(name.split()) > 1 else ""
        organization_name = name if role == "organizer" else ""

        user = User.objects.create_user(
            username=username,
            email=email,
            password=password,
            role=role,
            first_name=first_name,
            last_name=last_name,
            organization_name=organization_name,
        )
        return user


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ["id", "event", "message", "is_read", "created_at"]
        read_only_fields = ["id", "event", "message", "created_at"]
