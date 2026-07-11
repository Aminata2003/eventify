import { useMemo } from "react";
import { MapPin, Calendar, Clock } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import QRCode from "react-qr-code";
import { categoryIcons } from "../data/categoryIcons";

// Formatte une date "2026-08-24" en "24 août", sans dépendre d'un champ
// dateLabel précalculé (qui n'existe pas dans les données réelles du backend).
function formatDateLabel(dateStr) {
  if (!dateStr) return "";
  const date = new Date(`${dateStr}T00:00:00`);
  if (Number.isNaN(date.getTime())) return dateStr;
  return date.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
}

// Formatte le prix à partir des vrais champs du backend (price + price_currency)
// au lieu d'un champ price précalculé en texte.
function formatPrice(event) {
  if (!event.price || Number(event.price) === 0) return "Gratuit";
  return `${Number(event.price).toLocaleString("fr-FR")} ${event.price_currency ?? "FCFA"}`;
}

function TicketCard({ event, onCancel, onConfirmWaitlist, isUpcoming }) {
  const { user } = useAuth();
  const Icon = categoryIcons[event.category];
  const ticketData = useMemo(() => {
    const userId = user?.id ?? "guest";
    const payload = `eventify://ticket?event=${event.id}&user=${userId}&date=${event.date}`;
    return payload;
  }, [event.id, event.date, user?.id]);

  return (
    <div className="flex bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden border border-gray-100">
      {/* Image à gauche */}
      <div className="w-28 sm:w-36 flex-shrink-0">
        <img src={event.image} alt={event.title} className="w-full h-full object-cover" />
      </div>
      {/* Séparation en pointillés + encoches (effet billet) */}
      <div className="relative flex-shrink-0 w-0">
        <div className="absolute -top-3 -left-3 w-6 h-6 bg-orange-50/30 rounded-full" />
        <div className="absolute -bottom-3 -left-3 w-6 h-6 bg-orange-50/30 rounded-full" />
        <div className="h-full border-l-2 border-dashed border-gray-200" />
      </div>
      {/* Corps du billet */}
      <div className="flex-1 p-4 flex flex-col justify-between min-w-0">
        <div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-primary flex items-center gap-1">
              {Icon && <Icon size={12} />}
              {event.category}
            </span>
            {event.user_registration_status === "waitlist" ? (
              <span className="text-[10px] uppercase tracking-wide bg-yellow-100 text-yellow-700 font-semibold px-2.5 py-0.5 rounded-full">
                Liste d'attente
              </span>
            ) : event.user_registration_status === "pending" ? (
              <span className="text-[10px] uppercase tracking-wide bg-stone-100 text-stone-600 font-semibold px-2.5 py-0.5 rounded-full">
                En attente
              </span>
            ) : (
              <span className="text-[10px] uppercase tracking-wide bg-green-100 text-green-700 font-semibold px-2.5 py-0.5 rounded-full">
                Confirmé
              </span>
            )}
          </div>
          <h3 className="font-semibold text-gray-900 mt-1.5 leading-snug truncate">
            {event.title}
          </h3>
          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <Calendar size={12} /> {formatDateLabel(event.date)}
            </span>
            <span className="flex items-center gap-1">
              <Clock size={12} /> {event.time}
            </span>
            <span className="flex items-center gap-1">
              <MapPin size={12} /> {event.venue || event.location}
            </span>
          </div>
        </div>
        <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <div className="text-sm font-semibold text-gray-900">{formatPrice(event)}</div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-1">
              <a href={`/event/${event.id}`} className="text-xs font-medium text-primary hover:underline">
                Voir le billet
              </a>
              {/* Bug #5 corrigé : boutons d'action uniquement sur les événements à venir */}
              {isUpcoming && event.user_registration_status === "waitlist" && (event.confirmed_count < event.places) && (
                <button
                  onClick={() => onConfirmWaitlist(event.user_registration_id, event.price, event.id)}
                  className="text-xs font-medium text-emerald-600 hover:text-emerald-700 hover:underline"
                >
                  Confirmer ma place
                </button>
              )}
              {isUpcoming && (
                <button
                  onClick={() => {
                    if (window.confirm("Êtes-vous sûr de vouloir annuler votre inscription à cet événement ?")) {
                      onCancel(event.id);
                    }
                  }}
                  className="text-xs font-medium text-red-500 hover:text-red-700 hover:underline"
                >
                  Annuler l'inscription
                </button>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-3xl bg-slate-50 p-3">
            <div className="rounded-xl bg-white p-2 shadow-sm">
              <QRCode value={ticketData} size={88} />
            </div>
            <div className="text-xs text-gray-500">
              Billet scannable
              <div className="mt-1 text-[10px] text-stone-400">
                Présentez ce QR code à l'entrée.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TicketCard;
