from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils.translation import gettext_lazy as _


class User(AbstractUser):
    ROLE_CHOICES = (
        ("participant", "Participant"),
        ("organizer", "Organisateur"),
    )
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default="participant")
    phone = models.CharField(max_length=20, blank=True)
    organization_name = models.CharField(max_length=255, blank=True)

    def __str__(self):
        return self.email or self.username


class Event(models.Model):
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    category = models.CharField(max_length=100, blank=True)
    date = models.DateField()
    time = models.TimeField(blank=True, null=True)
    location = models.CharField(max_length=255)
    venue = models.CharField(max_length=255, blank=True)
    image = models.URLField(blank=True)
    is_public = models.BooleanField(default=True)
    allowed_users = models.JSONField(default=list, blank=True)
    places = models.PositiveIntegerField(default=0)
    price = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    price_currency = models.CharField(max_length=10, default="FCFA")
    organizer = models.ForeignKey(User, related_name="organized_events", on_delete=models.CASCADE)
    views_count = models.PositiveIntegerField(default=0)
    registrations_count = models.PositiveIntegerField(default=0)
    status = models.CharField(max_length=20, default="published")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    @property
    def capacity(self):
        return self.places

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.title


class Registration(models.Model):
    STATUS_CHOICES = (
        ("confirmed", "Confirmé"),
        ("pending", "En attente"),
        ("waitlist", "Liste d'attente"),
    )
    event = models.ForeignKey(Event, related_name="registrations", on_delete=models.CASCADE)
    participant = models.ForeignKey(User, related_name="registrations", on_delete=models.CASCADE)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="confirmed")
    registered_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("event", "participant")

    def __str__(self):
        return f"{self.participant} -> {self.event}"
