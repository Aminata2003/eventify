from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils.translation import gettext_lazy as _


class User(AbstractUser):
    ROLE_CHOICES = (
        ("participant", "Participant"),
        ("organizer", "Organisateur"),
    )
    email = models.EmailField(_("email address"), unique=True)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default="participant")
    phone = models.CharField(max_length=20, blank=True)
    organization_name = models.CharField(max_length=255, blank=True)
    favorites = models.ManyToManyField("Event", related_name="favorited_by", blank=True)

    def __str__(self):
        return self.email or self.username


class Event(models.Model):
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    category = models.CharField(max_length=100, blank=False)
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
    reminder_sent = models.BooleanField(default=False)
    registered_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("event", "participant")

    def __str__(self):
        return f"{self.participant} -> {self.event}"


class Payment(models.Model):
    PROVIDER_CHOICES = (
        ("card", "Carte bancaire"),
        ("mobile_money", "Mobile money"),
    )

    STATUS_CHOICES = (
        ("pending", "En attente"),
        ("completed", "Complété"),
        ("failed", "Échoué"),
    )

    event = models.ForeignKey(Event, related_name="payments", on_delete=models.CASCADE)
    participant = models.ForeignKey(User, related_name="payments", on_delete=models.CASCADE)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    currency = models.CharField(max_length=10, default="FCFA")
    provider = models.CharField(max_length=20, choices=PROVIDER_CHOICES)
    payment_method = models.CharField(max_length=50, blank=True)
    phone = models.CharField(max_length=30, blank=True)
    reference = models.CharField(max_length=64, unique=True)
    session_id = models.CharField(max_length=64, unique=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")
    metadata = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"Payment {self.reference} to {self.event.title}"


class Review(models.Model):
    """Review left by a participant after an event finishes."""
    event = models.ForeignKey(Event, related_name="reviews", on_delete=models.CASCADE)
    participant = models.ForeignKey(User, related_name="reviews", on_delete=models.CASCADE)
    rating = models.PositiveSmallIntegerField(default=5)
    comment = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        unique_together = (("event", "participant"),)

    def __str__(self):
        return f"Review {self.rating} by {self.participant} for {self.event}"


class Notification(models.Model):
    recipient = models.ForeignKey(User, related_name="notifications", on_delete=models.CASCADE)
    event = models.ForeignKey(Event, on_delete=models.CASCADE)
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"Notification for {self.recipient} -> {self.message[:30]}"
