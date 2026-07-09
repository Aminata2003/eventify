import re

from django.contrib.auth import get_user_model
from rest_framework import serializers
from .models import Event, Registration

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ["id", "username", "email", "role", "first_name", "last_name", "organization_name", "name"]

    def get_name(self, obj):
        return obj.get_full_name() or obj.username or obj.email or ""


class EventSerializer(serializers.ModelSerializer):
    organizer = UserSerializer(read_only=True)
    capacity = serializers.SerializerMethodField()

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
            "status",
        ]

    def get_capacity(self, obj):
        return obj.capacity


class EventCreateSerializer(serializers.ModelSerializer):
    capacity = serializers.IntegerField(required=False, write_only=True)

    class Meta:
        model = Event
        fields = [
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
        ]

    def create(self, validated_data):
        capacity = validated_data.pop("capacity", None)
        if capacity is not None and "places" not in validated_data:
            validated_data["places"] = capacity
        return super().create(validated_data)


class RegistrationSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(source="participant.id", read_only=True)
    name = serializers.SerializerMethodField()
    email = serializers.SerializerMethodField()
    registered_at = serializers.DateTimeField(read_only=True)

    class Meta:
        model = Registration
        fields = ["id", "name", "email", "registered_at", "status"]

    def get_name(self, obj):
        return obj.participant.get_full_name() or obj.participant.username or obj.participant.email or ""

    def get_email(self, obj):
        return obj.participant.email


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