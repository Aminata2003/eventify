from django.core.mail import send_mail
from django.core.management.base import BaseCommand
from django.conf import settings


class Command(BaseCommand):
    help = "Envoyer un email de test pour vérifier la configuration SMTP."

    def add_arguments(self, parser):
        parser.add_argument(
            "--to",
            dest="to_email",
            required=True,
            help="Adresse email de destination pour le test.",
        )

    def handle(self, *args, **options):
        recipient = options["to_email"]
        subject = "Test d'email Eventify"
        message = (
            "Bonjour,\n\n"
            "Ceci est un email de test envoyé depuis Eventify pour vérifier la configuration SMTP.\n\n"
            "Si vous recevez ce message, la configuration est correcte.\n\n"
            "Cordialement,\nEventify"
        )

        send_mail(
            subject,
            message,
            settings.DEFAULT_FROM_EMAIL,
            [recipient],
            fail_silently=False,
        )

        self.stdout.write(self.style.SUCCESS(f"Email de test envoyé à {recipient}"))
