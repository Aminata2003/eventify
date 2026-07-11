import { useMemo, useState, useEffect } from "react";
import { History, Calendar, MapPin } from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { getEvents } from "../services/eventService";

function timeAgo(dateString) {
  const diffMs = Date.now() - new Date(dateString).getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "Aujourd'hui";
  if (diffDays === 1) return "Hier";
  if (diffDays < 7) return `Il y a ${diffDays} jours`;
  if (diffDays < 30) return `Il y a ${Math.floor(diffDays / 7)} semaine(s)`;
  return `Il y a ${Math.floor(diffDays / 30)} mois`;
}

function Updates() {
  const isLoggedIn = false; // remplacer par contexte d'authentification si nécessaire
  const [events, setEvents] = useState([]);

  useEffect(() => {
    let cancelled = false;
    getEvents()
      .then((data) => {
        if (!cancelled) setEvents(data);
      })
      .catch(() => {
        if (!cancelled) setEvents([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const updatedEvents = useMemo(() => {
    return events
      .filter((event) => isLoggedIn || event.is_public)
      .filter((event) => event.updated_at)
      .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
  }, [events]);

  return (
    <div className="min-h-screen bg-orange-50/30 flex flex-col">
      <Navbar />

      <div className="flex-1 max-w-3xl mx-auto w-full px-8 pt-10 pb-16">
        <p className="text-gray-500 mt-2">
          Suivez les derniers changements apportés aux événements.
        </p>

        <div className="mt-8 flex flex-col gap-4">
          {updatedEvents.map((event) => (
            <a
              key={event.id}
              href={`/event/${event.id}`}
              className="flex gap-4 bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow p-4"
            >
              <img
                src={event.image}
                alt={event.title}
                className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
              />

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-medium text-primary">{event.category}</span>
                  <span className="text-xs text-gray-400 flex items-center gap-1 whitespace-nowrap">
                    <History size={12} />
                    {timeAgo(event.updatedAt)}
                  </span>
                </div>

                <h3 className="font-semibold text-gray-900 mt-1 truncate">{event.title}</h3>

                <p className="text-sm text-gray-500 mt-1 line-clamp-1">
                  {event.updateNote}
                </p>

                <div className="flex gap-4 mt-2 text-xs text-gray-400">
                  <span className="flex items-center gap-1">
                    <Calendar size={11} /> {event.dateLabel}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin size={11} /> {event.venue}
                  </span>
                </div>
              </div>
            </a>
          ))}

          {updatedEvents.length === 0 && (
            <p className="text-center text-gray-500 mt-10">
              Aucune mise à jour récente pour le moment.
            </p>
          )}
        </div>
      </div>
       <Footer />
    </div>
  );
}

export default Updates;