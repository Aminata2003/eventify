import { Heart, MapPin, Calendar } from "lucide-react";

function EventCard({ event }) {
  return (
    <div className="rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow overflow-hidden bg-white flex flex-col">
      <div className="relative">
        <img src={event.image} alt={event.title} className="w-full h-48 object-cover" />
        <span className="absolute top-3 left-3 bg-white text-xs font-medium px-2 py-1 rounded">
          {event.category}
        </span>
        <button className="absolute top-3 right-3 bg-white rounded-full p-1.5">
          <Heart size={16} className="text-gray-500" />
        </button>


      </div>



      <div className="p-6 flex flex-col flex-1">
        <div className="flex items-center gap-1 text-xs text-primary font-medium">
          <Calendar size={12} />
          {event.dateLabel} · {event.time}
        </div>
        <h3 className="font-semibold text-gray-900 mt-2 leading-snug">{event.title}</h3>
        <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
          <MapPin size={12} />
          {event.venue}
        </div>
        <p className="text-sm text-gray-500 mt-2 line-clamp-2 leading-relaxed">{event.description}</p>

        <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
          <span className="font-semibold text-gray-900">{event.price}</span>
          <a href={`/event/${event.id}`} className="text-sm font-medium text-primary hover:underline">
            {event.cta}
          </a>
        </div>


      </div>


    </div>

  );
}


export default EventCard;