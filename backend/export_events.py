import os
import json
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "eventify_backend.settings")
django.setup()

from events.models import User, Event, Registration, Payment, Review


data = []

## Users
for obj in User.objects.all():
    data.append({
        "model": "events.user",
        "pk": obj.pk,
        "fields": {
            "password": obj.password,
            "last_login": obj.last_login.isoformat() if obj.last_login else None,
            "is_superuser": obj.is_superuser,
            "username": obj.username,
            "first_name": obj.first_name,
            "last_name": obj.last_name,
            "email": obj.email,
            "is_staff": obj.is_staff,
            "is_active": obj.is_active,
            "date_joined": obj.date_joined.isoformat(),
            "role": obj.role,
            "phone": obj.phone,
            "organization_name": obj.organization_name,
        }
    })
# Events
for obj in Event.objects.all():
    data.append({
        "model": "events.event",
        "pk": obj.pk,
        "fields": {
            "title": obj.title,
            "description": obj.description,
            "category": obj.category,
            "date": obj.date.isoformat(),
            "time": obj.time.isoformat() if obj.time else None,
            "location": obj.location,
            "venue": obj.venue,
            "image": obj.image,
            "is_public": obj.is_public,
            "allowed_users": obj.allowed_users,
            "places": obj.places,
            "price": str(obj.price),
            "price_currency": obj.price_currency,
            "organizer": obj.organizer_id,
            "views_count": obj.views_count,
            "registrations_count": obj.registrations_count,
            "status": obj.status,
            "created_at": obj.created_at.isoformat(),
            "updated_at": obj.updated_at.isoformat(),
        }
    })


# Registrations
for obj in Registration.objects.all():
    data.append({
        "model": "events.registration",
        "pk": obj.pk,
        "fields": {
            "event": obj.event_id,
            "participant": obj.participant_id,
            "status": obj.status,
            "reminder_sent": obj.reminder_sent,
            "registered_at": obj.registered_at.isoformat(),
        }
    })


# Payments
for obj in Payment.objects.all():
    data.append({
        "model": "events.payment",
        "pk": obj.pk,
        "fields": {
            "event": obj.event_id,
            "participant": obj.participant_id,
            "amount": str(obj.amount),
            "currency": obj.currency,
            "provider": obj.provider,
            "payment_method": obj.payment_method,
            "phone": obj.phone,
            "reference": obj.reference,
            "session_id": obj.session_id,
            "status": obj.status,
            "metadata": obj.metadata,
            "created_at": obj.created_at.isoformat(),
            "updated_at": obj.updated_at.isoformat(),
        }
    })

with open("events_data.json", "w", encoding="utf-8") as f:
    json.dump(data, f, indent=2, ensure_ascii=False)


print("Export terminé :", len(data), "objets")