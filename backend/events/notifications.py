from datetime import datetime

from django.conf import settings
from django.core.mail import send_mail
import logging

logger = logging.getLogger(__name__)


def _format_event_datetime(event):
    date_text = event.date.strftime("%d/%m/%Y") if event.date else ""
    time_text = event.time.strftime("%H:%M") if event.time else "Heure à confirmer"
    return date_text, time_text


def _send_email(subject, message, recipient_list):
    try:
        send_mail(
            subject,
            message,
            settings.DEFAULT_FROM_EMAIL,
            recipient_list,
            fail_silently=False,
        )
        return True
    except Exception as exc:
        logger.error("Échec envoi email à %s: %s", recipient_list, exc)
        return False


def send_registration_notifications(event, participant, payment_method=None):
    if not participant.email:
        return

    subject_user = f"Confirmation d'inscription — {event.title}"
    date_text, time_text = _format_event_datetime(event)
    message_user = (
        f"Bonjour {participant.get_full_name() or participant.username},\n\n"
        f"Votre inscription à l'événement '{event.title}' a bien été enregistrée.\n"
        f"Date : {date_text} {time_text}\n"
        f"Lieu : {event.location}\n"
    )
    if event.price and event.price > 0:
        message_user += (
            f"Montant : {event.price} {event.price_currency}\n"
            f"Mode de paiement : {payment_method or 'Non spécifié'}\n"
        )
    message_user += "\nMerci de votre participation.\nEventify"

    _send_email(subject_user, message_user, [participant.email])

    if event.organizer.email:
        subject_org = f"Nouvelle inscription à votre événement — {event.title}"
        message_org = (
            f"Bonjour {event.organizer.get_full_name() or event.organizer.username},\n\n"
            f"Une nouvelle inscription a été réalisée pour votre événement '{event.title}'.\n"
            f"Participant : {participant.get_full_name() or participant.username} ({participant.email})\n"
            f"Date : {date_text} {time_text}\n"
        )
        if event.price and event.price > 0:
            message_org += f"Mode de paiement : {payment_method or 'Non spécifié'}\n"
        message_org += "\nMerci de suivre votre événement sur Eventify.\n"

        _send_email(subject_org, message_org, [event.organizer.email])


def send_event_reminder_notification(registration):
    event = registration.event
    participant = registration.participant
    if not participant.email:
        return

    subject = f"Rappel : {event.title} demain"
    date_text, time_text = _format_event_datetime(event)
    message = (
        f"Bonjour {participant.get_full_name() or participant.username},\n\n"
        f"Ceci est un rappel pour l'événement auquel vous êtes inscrit : '{event.title}'.\n"
        f"Date : {date_text} {time_text}\n"
        f"Lieu : {event.location}\n"
    )
    if event.venue:
        message += f"Lieu exact : {event.venue}\n"
    if event.price and event.price > 0:
        message += f"Montant : {event.price} {event.price_currency}\n"
    message += "\nNous vous souhaitons une excellente participation.\nEventify"

    _send_email(subject, message, [participant.email])


def send_event_organizer_reminder(event, registrations):
    if not event.organizer.email:
        return

    subject = f"Rappel organisateur : {event.title} demain"
    date_text, time_text = _format_event_datetime(event)
    participant_count = len(registrations)
    message = (
        f"Bonjour {event.organizer.get_full_name() or event.organizer.username},\n\n"
        f"Votre événement '{event.title}' a lieu demain.\n"
        f"Date : {date_text} {time_text}\n"
        f"Lieu : {event.location}\n"
        f"Participants inscrits : {participant_count}\n"
    )
    if participant_count > 0:
        message += "\nListe des participants :\n"
        for registration in registrations:
            user = registration.participant
            message += f"- {user.get_full_name() or user.username} ({user.email})\n"
    message += "\nBonne préparation pour votre événement.\nEventify"

    send_mail(
        subject,
        message,
        settings.DEFAULT_FROM_EMAIL,
        [event.organizer.email],
        fail_silently=True,
    )
