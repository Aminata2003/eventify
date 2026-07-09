from django.core.management.base import BaseCommand
from events.models import Event, Registration, User
from django.utils import timezone


class Command(BaseCommand):
    help = "Seed initial events and registrations matching the frontend demo data"

    def handle(self, *args, **options):
        User.objects.filter(username="organizer").delete()
        organizer, _ = User.objects.get_or_create(
            username="organizer",
            defaults={"email": "organizer@eventify.dev", "role": "organizer", "first_name": "Eventify", "last_name": "Sénégal"},
        )

        events_data = [
            {
                "title": "Festival Sabar & Percussions",
                "description": "Une nuit de percussions traditionnelles et de sonorités modernes avec les meilleurs artistes sénégalais.",
                "category": "Musique",
                "date": "2026-08-24",
                "time": "20:00:00",
                "location": "Dakar",
                "venue": "Corniche de Dakar",
                "image": "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=600",
                "is_public": True,
                "status": "published",
                "price": 10000,
                "price_currency": "FCFA",
                "places": 200,
                "views_count": 1240,
                "registrations_count": 45,
            },
            {
                "title": "Masterclass IA & Développement Web",
                "description": "Une immersion pratique dans l'IA générative et les frameworks web modernes.",
                "category": "Atelier",
                "date": "2026-09-12",
                "time": "10:00:00",
                "location": "Dakar",
                "venue": "Ker Xaleyi, Dakar",
                "image": "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=600",
                "is_public": True,
                "status": "published",
                "price": 0,
                "price_currency": "FCFA",
                "places": 150,
                "views_count": 890,
                "registrations_count": 120,
            },
            {
                "title": "Soirée Thiéboudienne : Dîner Gastronomique",
                "description": "Un menu dégustation revisitant les classiques de la cuisine sénégalaise.",
                "category": "Gastronomie",
                "date": "2026-09-05",
                "time": "19:30:00",
                "location": "Saint-Louis",
                "venue": "Restaurant La Teranga, Saint-Louis",
                "image": "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600",
                "is_public": True,
                "status": "published",
                "price": 25000,
                "price_currency": "FCFA",
                "places": 80,
                "views_count": 654,
                "registrations_count": 32,
            },
        ]

        for data in events_data:
            Event.objects.get_or_create(title=data["title"], defaults={**data, "organizer": organizer})

        participant_names = [
            ("Aminata Diop", "aminata.diop@exemple.com"),
            ("Moussa Fall", "moussa.fall@exemple.com"),
            ("Fatou Ndiaye", "fatou.ndiaye@exemple.com"),
            ("Ibrahima Sarr", "ibrahima.sarr@exemple.com"),
            ("Marième Ba", "marieme.ba@exemple.com"),
        ]

        for name, email in participant_names:
            User.objects.get_or_create(username=email, defaults={"email": email, "first_name": name.split()[0], "last_name": " ".join(name.split()[1:])})

        first_event = Event.objects.first()
        if first_event:
            for participant in User.objects.exclude(username="organizer").order_by("id")[:3]:
                Registration.objects.get_or_create(event=first_event, participant=participant, defaults={"status": "confirmed"})

        self.stdout.write(self.style.SUCCESS("Seed data created successfully"))
