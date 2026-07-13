import { useMemo, useState, useEffect } from "react";
import { History, Calendar, MapPin } from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { getEvents } from "../services/eventService";
import { formatDateLabel } from "../utils/eventHelpers";
import { useAuth } from "../context/AuthContext";

function timeAgo(dateString) {
  if (!dateString) return "Date inconnue";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "Date invalide";

  const diffMs = Date.now() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return "À l'instant";
  if (diffMins < 60) return `Il y a ${diffMins} min`;
  if (diffHours < 24) return `Il y a ${diffHours}h`;
  if (diffDays === 0) return "Aujourd'hui";
  if (diffDays === 1) return "Hier";
  if (diffDays < 7) return `Il y a ${diffDays} jours`;
  if (diffDays < 30) return `Il y a ${Math.floor(diffDays / 7)} semaine(s)`;
  return `Il y a ${Math.floor(diffDays / 30)} mois`;
}

function formatExactDate(dateString) {
  if (!dateString) return "";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "";
  return date.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function Updates() {
  const { user } = useAuth();
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
      .filter((event) => user || event.is_public)
      .filter((event) => event.updated_at)
      .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
  }, [events, user]);

  return (
    <div className="min-h-screen bg-orange-50/30 flex flex-col">
      <Navbar />

      <div className="flex-1 max-w-3xl mx-auto w-full px-8 pt-10 pb-16">
        <h1 className="text-3xl font-bold text-gray-900">Mises à jour</h1>
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
              {event.image ? (
                <img
                  src={event.image}
                  alt={event.title}
                  className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
                  onError={(e) => { e.currentTarget.style.display = "none"; }}
                />
              ) : (
                <div className="w-20 h-20 rounded-lg bg-stone-100 flex-shrink-0 flex items-center justify-center text-stone-300 text-xs">
                  Pas d'image
                </div>
              )}

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-medium text-primary">{event.category}</span>
                  <span
                    className="text-xs text-gray-400 flex items-center gap-1 whitespace-nowrap"
                    title={formatExactDate(event.updated_at)}
                  >
                    <History size={12} />
                    {timeAgo(event.updated_at)}
                  </span>
                </div>

                <h3 className="font-semibold text-gray-900 mt-1 truncate">{event.title}</h3>

                <p className="text-xs text-gray-400 mt-0.5 italic">
                  Modifié le {formatExactDate(event.updated_at)}
                </p>

                <div className="flex gap-4 mt-2 text-xs text-gray-400">
                  <span className="flex items-center gap-1">
                    <Calendar size={11} /> {formatDateLabel(event.date)}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin size={11} /> {event.venue || event.location || "—"}
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