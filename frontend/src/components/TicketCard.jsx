import { MapPin, Calendar, Clock } from "lucide-react";
import { categoryIcons } from "../data/categoryIcons";

function TicketCard({ event }) {
  const Icon = categoryIcons[event.category];

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
            <span className="text-[10px] uppercase tracking-wide bg-green-50 text-green-700 font-semibold px-2 py-0.5 rounded-full">
              Confirmé
            </span>
          </div>

          <h3 className="font-semibold text-gray-900 mt-1.5 leading-snug truncate">
            {event.title}
          </h3>

          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <Calendar size={12} /> {event.dateLabel}
            </span>
            <span className="flex items-center gap-1">
              <Clock size={12} /> {event.time}
            </span>
            <span className="flex items-center gap-1">
              <MapPin size={12} /> {event.venue}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
          <span className="text-sm font-semibold text-gray-900">{event.price}</span>
          <a href={`/event/${event.id}`} className="text-xs font-medium text-primary hover:underline">
            Voir le billet
          </a>
        </div>
      </div>
    </div>
  );
}

export default TicketCard;