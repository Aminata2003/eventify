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


def send_cancellation_notification_to_organizer(event, participant):
    if not event.organizer.email:
        return
    subject = f"Annulation d'inscription — {event.title}"
    date_text, time_text = _format_event_datetime(event)
    message = (
        f"Bonjour {event.organizer.get_full_name() or event.organizer.username},\n\n"
        f"Le participant {participant.get_full_name() or participant.username} ({participant.email}) "
        f"a annulé son inscription à votre événement '{event.title}'.\n"
        f"Date de l'événement : {date_text} à {time_text}\n\n"
        f"Merci,\nEventify"
    )
    _send_email(subject, message, [event.organizer.email])


def send_event_cancelled_notification(event, participants):
    subject = f"IMPORTANT : Annulation de l'événement — {event.title}"
    date_text, time_text = _format_event_datetime(event)
    for participant in participants:
        if not participant.email:
            continue
        message = (
            f"Bonjour {participant.get_full_name() or participant.username},\n\n"
            f"Nous vous informons que l'événement '{event.title}', prévu le {date_text} à {time_text}, "
            f"a été annulé par l'organisateur.\n\n"
            f"Nous nous excusons pour le désagrément.\nEventify"
        )
        _send_email(subject, message, [participant.email])


def send_event_modified_notification(event, participants, changes_desc):
    subject = f"Mise à jour de l'événement — {event.title}"
    date_text, time_text = _format_event_datetime(event)
    for participant in participants:
        if not participant.email:
            continue
        message = (
            f"Bonjour {participant.get_full_name() or participant.username},\n\n"
            f"Des modifications importantes ont été apportées à l'événement '{event.title}' auquel vous êtes inscrit(e) :\n"
            f"{changes_desc}\n\n"
            f"Nouvelles informations :\n"
            f"Date : {date_text} à {time_text}\n"
            f"Lieu : {event.location}\n"
            f"Lieu exact : {event.venue or 'Non spécifié'}\n\n"
            f"Merci de votre confiance,\nEventify"
        )
        _send_email(subject, message, [participant.email])


def send_waitlist_notification(event, participant):
    if not participant.email:
        return
    subject = f"Inscription sur liste d'attente — {event.title}"
    date_text, time_text = _format_event_datetime(event)
    message = (
        f"Bonjour {participant.get_full_name() or participant.username},\n\n"
        f"L'événement '{event.title}' est actuellement complet. "
        f"Vous avez été ajouté(e) à la liste d'attente.\n"
        f"Nous vous préviendrons par e-mail dès qu'une place se libèrera afin que vous puissiez confirmer votre inscription.\n\n"
        f"Merci,\nEventify"
    )
    _send_email(subject, message, [participant.email])


def send_waitlist_available_notification(event, participant):
    if not participant.email:
        return
    subject = f"Une place s'est libérée ! — {event.title}"
    date_text, time_text = _format_event_datetime(event)
    message = (
        f"Bonjour {participant.get_full_name() or participant.username},\n\n"
        f"Bonne nouvelle ! Une place s'est libérée pour l'événement '{event.title}' (prévu le {date_text} à {time_text}).\n"
        f"Vous étiez en tête de la liste d'attente. Vous pouvez dès maintenant confirmer votre inscription "
        f"depuis votre espace personnel sur Eventify.\n\n"
        f"Veuillez noter que si l'événement est payant, la confirmation nécessitera le règlement des frais de participation.\n\n"
        f"À très bientôt,\nEventify"
    )
    _send_email(subject, message, [participant.email])


def send_participant_cancellation_confirmation(event, participant):
    """Bug #4 : Confirmation d'annulation envoyée au participant lui-même."""
    if not participant.email:
        return
    subject = f"Annulation de votre inscription — {event.title}"
    date_text, time_text = _format_event_datetime(event)
    message = (
        f"Bonjour {participant.get_full_name() or participant.username},\n\n"
        f"Votre inscription à l'événement '{event.title}' (prévu le {date_text} à {time_text}) "
        f"a bien été annulée.\n\n"
        f"Si vous souhaitez vous réinscrire ultérieurement, rendez-vous sur Eventify.\n\n"
        f"Cordialement,\nEventify"
    )
    _send_email(subject, message, [participant.email])


def send_private_event_invitation(event, invited_email, frontend_url):
    """Envoie une invitation par e-mail pour un événement privé.

    Appelée quand un organisateur ajoute une adresse e-mail dans allowed_users.
    Le destinataire n'est pas forcément inscrit sur la plateforme.
    """
    date_text, time_text = _format_event_datetime(event)
    event_url = f"{frontend_url.rstrip('/')}/event/{event.id}"

    subject = f"Vous êtes invité(e) à l'événement : {event.title}"
    message = (
        f"Bonjour,\n\n"
        f"L'organisateur {event.organizer.get_full_name() or event.organizer.username} "
        f"vous invite à participer à l'événement privé :\n\n"
        f"  📅 {event.title}\n"
        f"  🗓  Date : {date_text} à {time_text}\n"
        f"  📍 Lieu : {event.location}"
        + (f" — {event.venue}" if event.venue else "")
        + "\n"
    )
    if event.price and event.price > 0:
        message += f"  💰 Prix : {event.price} {event.price_currency}\n"
    else:
        message += "  🎟  Accès : Gratuit\n"

    message += (
        f"\nPour voir les détails et vous inscrire, cliquez sur le lien ci-dessous :\n"
        f"{event_url}\n\n"
        f"Cet événement est privé. Ce lien est destiné uniquement aux personnes invitées.\n\n"
        f"À très bientôt,\n"
        f"L'équipe Eventify"
    )
    _send_email(subject, message, [invited_email])


