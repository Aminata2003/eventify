import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Calendar, Clock, MapPin, Users } from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { getEventById, getEvents, registerToEvent } from "../services/eventService";

export default function EventDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [event, setEvent] = useState(null);
  const [relatedEvents, setRelatedEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [registered, setRegistered] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setRegistered(false);

    Promise.all([getEventById(id), getEvents()])
      .then(([eventData, allEvents]) => {
        if (cancelled) return;

        setEvent(eventData);
        setRelatedEvents(
          allEvents.filter((e) => String(e.id) !== String(id)).slice(0, 3)
        );
      })
      .catch(() => !cancelled && setError("Impossible de charger cet événement."))
      .finally(() => !cancelled && setLoading(false));

    return () => {
      cancelled = true;
    };
  }, [id]);

  async function handleRegister() {
    setRegistering(true);

    try {
      await registerToEvent(event.id, {});
      setRegistered(true);
    } finally {
      setRegistering(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50">
        <Navbar />
        <p className="mx-auto max-w-4xl px-6 py-16 text-center text-stone-500">
          Chargement de l'événement...
        </p>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen bg-stone-50">
        <Navbar />
        <p className="mx-auto max-w-4xl px-6 py-16 text-center text-red-600">
          {error || "Événement introuvable."}
        </p>
      </div>
    );
  }

  const spotsLeft = event.capacity - event.registrations_count;

  return (
    <div className="min-h-screen bg-stone-50">
      <Navbar active="discover" />

      {/* Hero */}
      <div className="relative h-72 w-full overflow-hidden sm:h-96">
        <img
          src={event.image}
          alt={event.title}
          className="h-full w-full object-cover"
        />

        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

        <div className="absolute bottom-6 left-0 w-full px-6">
          <div className="mx-auto max-w-4xl">
            <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-medium text-stone-800">
              {event.category}
            </span>

            <h1 className="mt-3 max-w-2xl text-2xl font-bold text-white sm:text-3xl">
              {event.title}
            </h1>
          </div>
        </div>
      </div>


      <main className="mx-auto grid max-w-4xl grid-cols-1 gap-8 px-6 py-8 lg:grid-cols-3">

        {/* Colonne principale */}
        <div className="lg:col-span-2">

          <div className="flex flex-wrap gap-6 border-b border-stone-200 pb-6 text-sm text-stone-600">
            <span className="flex items-center gap-2">
              <Calendar size={16} /> {event.date}
            </span>

            <span className="flex items-center gap-2">
              <Clock size={16} /> {event.time}
            </span>

            <span className="flex items-center gap-2">
              <MapPin size={16} /> {event.location}
            </span>
          </div>


          <div className="flex items-center justify-between py-6">
            <div>
              <p className="text-xs text-stone-400">
                Organisé par
              </p>

              <p className="text-sm font-medium text-stone-800">
                {event.organizer.name}
              </p>
            </div>

            <button className="text-sm font-medium text-red-600 hover:underline">
              Suivre
            </button>
          </div>


          <div>
            <h2 className="text-lg font-semibold text-stone-900">
              À propos de cet événement
            </h2>

            <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-stone-600">
              {event.description}
            </p>
          </div>


          {event.highlights && (
            <div className="mt-6">
              <h3 className="text-sm font-semibold text-stone-900">
                À quoi s'attendre :
              </h3>

              <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm text-stone-600">
                {event.highlights.map((h) => (
                  <li key={h}>{h}</li>
                ))}
              </ul>
            </div>
          )}

        </div>


        {/* Colonne inscription */}
        <aside className="space-y-4">

          <div className="rounded-xl border border-stone-200 bg-white p-5">

            <p className="text-xs text-stone-400">
              Billets à partir de
            </p>

            <p className="text-2xl font-bold text-stone-900">
              {event.price > 0
                ? `${event.price.toLocaleString("fr-FR")} FCFA`
                : "Gratuit"}
            </p>


            <p className="mt-1 flex items-center gap-1.5 text-xs text-stone-400">
              <Users size={13} />
              {spotsLeft} places restantes
            </p>


            <button
              onClick={handleRegister}
              disabled={registering || registered || spotsLeft <= 0}
              className="mt-4 w-full rounded-lg bg-[#f6682f] py-2.5 text-sm font-medium text-white hover:bg-[#ea580c] disabled:opacity-60"
            >
              {registered
                ? "Inscription confirmée ✓"
                : spotsLeft <= 0
                ? "Complet"
                : registering
                ? "Inscription..."
                : "S'inscrire"}
            </button>


            {/* AJOUT : Gestion participants */}
            <button
              onClick={() => navigate(`/dashboard/${event.id}/participants`)}
              className="mt-3 w-full rounded-lg border border-[#f6682f] py-2.5 text-sm font-medium text-[#f6682f] transition hover:bg-[#f6682f] hover:text-white"
            >
              Gérer les participants
            </button>

          </div>


          <div className="rounded-xl bg-red-50 p-4 text-xs text-red-700">
            Politique de remboursement : les tarifs préférentiels ne sont pas
            remboursables. Contactez l'organisateur pour toute question.
          </div>

        </aside>

      </main>



      {relatedEvents.length > 0 && (
        <section className="mx-auto max-w-4xl px-6 pb-14">

          <h2 className="mb-4 text-lg font-semibold text-stone-900">
            Autres événements susceptibles de vous plaire
          </h2>


          <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">

            {relatedEvents.map((e) => (
              <Link
                key={e.id}
                to={`/event/${e.id}`}
                className="group overflow-hidden rounded-xl border border-stone-200 bg-white"
              >

                <img
                  src={e.image}
                  alt={e.title}
                  className="h-32 w-full object-cover transition-transform group-hover:scale-105"
                />


                <div className="p-3">

                  <p className="text-xs text-stone-400">
                    {e.date} • {e.location}
                  </p>

                  <p className="mt-1 text-sm font-medium text-stone-900 line-clamp-1">
                    {e.title}
                  </p>

                </div>

              </Link>
            ))}

          </div>

        </section>
      )}


      {/* AJOUT Footer */}
      <Footer />

    </div>
  );
}