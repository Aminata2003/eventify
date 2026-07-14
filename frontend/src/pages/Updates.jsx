import { useMemo, useState, useEffect, useCallback } from "react";
import { History, Calendar, MapPin, Bell, BellOff, ChevronRight, Clock } from "lucide-react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { getEvents, getMyEvents } from "../services/eventService";
import { formatDateLabel } from "../utils/eventHelpers";
import { useAuth } from "../context/AuthContext";

const STORAGE_KEY = "eventify_read_updates";

function getReadUpdates() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
  } catch {
    return {};
  }
}

function markAsRead(eventId, updatedAt) {
  const read = getReadUpdates();
  read[eventId] = updatedAt;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(read));
}

function isUnread(event) {
  const read = getReadUpdates();
  return !read[event.id] || read[event.id] !== event.updated_at;
}

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
    day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

// Déduit les types de modifications visibles depuis les données (heuristique simple)
function getChangeTypes(event) {
  const types = [];
  const updatedMs = new Date(event.updated_at).getTime();
  const createdMs = new Date(event.created_at).getTime();
  // Si modifié plus de 5 min après la création, c'est une vraie modif
  if (updatedMs - createdMs < 5 * 60 * 1000) return [];
  // On signale que l'événement a été modifié (sans détail précis côté frontend)
  types.push("mise à jour");
  if (event.status === "cancelled") types.push("annulation");
  return types;
}

const BADGE_COLORS = {
  "annulation": "bg-red-100 text-red-700",
  "mise à jour": "bg-orange-100 text-orange-700",
};

function Updates() {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [myEvents, setMyEvents] = useState([]);
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    let cancelled = false;
    getEvents()
      .then((data) => { if (!cancelled) setEvents(data); })
      .catch(() => { if (!cancelled) setEvents([]); });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!user || user.role !== "participant") return;
    let cancelled = false;
    getMyEvents()
      .then((data) => { if (!cancelled) setMyEvents(data); })
      .catch(() => { if (!cancelled) setMyEvents([]); });
    return () => { cancelled = true; };
  }, [user]);

  // IDs des événements auxquels le participant est inscrit
  const registeredEventIds = useMemo(() => new Set(myEvents.map((e) => e.id)), [myEvents]);

  // Événements modifiés pertinents pour ce participant
  const participantUpdates = useMemo(() => {
    if (!user || user.role !== "participant") return [];
    return events
      .filter((e) => registeredEventIds.has(e.id) && e.updated_at)
      .filter((e) => {
        const updatedMs = new Date(e.updated_at).getTime();
        const createdMs = new Date(e.created_at).getTime();
        return updatedMs - createdMs > 5 * 60 * 1000; // Ignoré si modif < 5 min après création
      })
      .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
  }, [events, registeredEventIds, user]);

  // Toutes les mises à jour (vue générale pour organisateurs ou non-connectés)
  const allUpdates = useMemo(() => {
    return events
      .filter((e) => (user || e.is_public) && e.updated_at)
      .filter((e) => {
        const updatedMs = new Date(e.updated_at).getTime();
        const createdMs = new Date(e.created_at).getTime();
        return updatedMs - createdMs > 5 * 60 * 1000;
      })
      .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
  }, [events, user]);

  const isParticipant = user && user.role === "participant";
  const displayUpdates = isParticipant ? participantUpdates : allUpdates;
  const unreadCount = displayUpdates.filter(isUnread).length;

  const handleMarkAllRead = useCallback(() => {
    displayUpdates.forEach((e) => markAsRead(e.id, e.updated_at));
    forceUpdate((n) => n + 1);
  }, [displayUpdates]);

  const handleClickNotif = useCallback((event) => {
    markAsRead(event.id, event.updated_at);
    forceUpdate((n) => n + 1);
  }, []);

  return (
    <div className="min-h-screen bg-orange-50/30 flex flex-col">
      <Navbar />

      <div className="flex-1 max-w-3xl mx-auto w-full px-8 pt-10 pb-16">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-gray-900">
                {isParticipant ? "Mes notifications" : "Mises à jour"}
              </h1>
              {unreadCount > 0 && (
                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-orange-500 text-white text-xs font-bold animate-pulse">
                  {unreadCount}
                </span>
              )}
            </div>
            <p className="text-gray-500 mt-2">
              {isParticipant
                ? "Modifications récentes sur les événements auxquels vous êtes inscrit(e)."
                : "Suivez les derniers changements apportés aux événements."}
            </p>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="flex items-center gap-2 text-sm text-gray-500 hover:text-primary transition px-3 py-1.5 rounded-lg border border-gray-200 hover:border-primary"
            >
              <BellOff size={14} />
              Tout marquer comme lu
            </button>
          )}
        </div>

        <div className="mt-8 flex flex-col gap-3">
          {displayUpdates.map((event) => {
            const unread = isUnread(event);
            const changeTypes = getChangeTypes(event);

            return (
              <Link
                key={event.id}
                to={`/event/${event.id}`}
                onClick={() => handleClickNotif(event)}
                className={`flex gap-4 rounded-xl border shadow-sm hover:shadow-md transition-all p-4 relative ${
                  unread
                    ? "bg-orange-50 border-orange-200"
                    : "bg-white border-gray-100"
                }`}
              >
                {/* Pastille non-lu */}
                {unread && (
                  <span className="absolute top-4 right-4 w-2.5 h-2.5 rounded-full bg-orange-500 flex-shrink-0" />
                )}

                {/* Image */}
                {event.image ? (
                  <img
                    src={event.image}
                    alt={event.title}
                    className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
                    onError={(e) => { e.currentTarget.style.display = "none"; }}
                  />
                ) : (
                  <div className="w-20 h-20 rounded-lg bg-stone-100 flex-shrink-0 flex items-center justify-center">
                    <Bell size={24} className="text-stone-300" />
                  </div>
                )}

                <div className="flex-1 min-w-0 pr-4">
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

                  {/* Badges de type de modification */}
                  {changeTypes.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      {changeTypes.map((type) => (
                        <span
                          key={type}
                          className={`text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full ${BADGE_COLORS[type] || "bg-gray-100 text-gray-600"}`}
                        >
                          {type}
                        </span>
                      ))}
                      {isParticipant && (
                        <span className="text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                          Vous êtes inscrit
                        </span>
                      )}
                    </div>
                  )}

                  <div className="flex gap-4 mt-2 text-xs text-gray-400 flex-wrap">
                    <span className="flex items-center gap-1">
                      <Calendar size={11} /> {formatDateLabel(event.date)}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin size={11} /> {event.venue || event.location || "—"}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 mt-2 text-xs font-medium text-primary">
                    Voir les détails
                    <ChevronRight size={12} />
                  </div>
                </div>
              </Link>
            );
          })}

          {displayUpdates.length === 0 && (
            <div className="text-center mt-16">
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto">
                <Bell size={28} className="text-gray-300" />
              </div>
              <p className="text-gray-500 mt-4 font-medium">
                {isParticipant
                  ? "Aucune mise à jour sur vos événements pour le moment."
                  : "Aucune mise à jour récente pour le moment."}
              </p>
              {isParticipant && (
                <p className="text-gray-400 text-sm mt-1">
                  Vous serez notifié ici dès qu'un événement auquel vous êtes inscrit sera modifié.
                </p>
              )}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}

export default Updates;
