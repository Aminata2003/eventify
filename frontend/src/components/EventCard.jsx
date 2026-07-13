import { Heart, MapPin, Calendar } from "lucide-react";
import { Link } from "react-router-dom";


function EventCard({ event }) {

  const formattedDate = event.date
    ? new Date(event.date).toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      })
    : "";


  // Gestion du prix
  const formatPrice = () => {

    if (
      event.price === null ||
      event.price === undefined ||
      event.price === "" ||
      event.price === "Don"
    ) {
      return "Don";
    }


    if (
      typeof event.price === "string" &&
      isNaN(Number(event.price))
    ) {
      return event.price;
    }


    const price = Number(event.price);


    if (price === 0) {
      return "Gratuit";
    }


    return `${price.toLocaleString("fr-FR")} ${
      event.price_currency || "FCFA"
    }`;
  };


  return (

    <div className="rounded-xl border border-gray-100 bg-white shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col">


      <div className="relative">


        <img
          src={
            event.image ||
            "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='600' height='400' viewBox='0 0 600 400'%3E%3Crect width='600' height='400' fill='%23f5f5f4'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='16' fill='%23a8a29e'%3ESans image%3C/text%3E%3C/svg%3E"
          }
          alt={event.title}
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src =
              "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='600' height='400' viewBox='0 0 600 400'%3E%3Crect width='600' height='400' fill='%23f5f5f4'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='16' fill='%23a8a29e'%3ESans image%3C/text%3E%3C/svg%3E";
          }}
          className="h-48 w-full object-cover"
        />


        <span className="absolute left-3 top-3 rounded bg-white px-2 py-1 text-xs font-medium">
          {event.category}
        </span>


        <button className="absolute right-3 top-3 rounded-full bg-white p-1.5">
          <Heart size={16} className="text-gray-500" />
        </button>


      </div>



      <div className="flex flex-1 flex-col p-6">


        <div className="flex items-center gap-1 text-xs font-medium text-primary">

          <Calendar size={12} />

          {formattedDate}

          {event.time && ` • ${event.time}`}

        </div>



        <h3 className="mt-2 font-semibold leading-snug text-gray-900">
          {event.title}
        </h3>



        <div className="mt-1 flex items-center gap-1 text-xs text-gray-500">

          <MapPin size={12} />

          {event.venue || event.location}

        </div>



        <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-gray-500">
          {event.description}
        </p>



        <div className="mt-3 text-xs text-gray-500">

          {event.capacity && (
            <>
              {event.registrations_count ?? 0}/{event.capacity} participants
            </>
          )}

        </div>



        <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3">


          <span className="font-semibold text-gray-900">
            {formatPrice()}
          </span>



          <Link
            to={`/event/${event.id}`}
            className="text-sm font-medium text-primary hover:underline"
          >
            Voir les détails
          </Link>


        </div>


      </div>


    </div>

  );
}


export default EventCard;