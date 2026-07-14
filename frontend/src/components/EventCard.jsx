import { Heart, MapPin, Calendar, Zap } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { toggleFavoriteEvent } from "../services/eventService";


function EventCard({ event, featured = false }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isFavorite, setIsFavorite] = useState(event.is_favorite || false);

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


  const handleFavoriteClick = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      navigate("/login");
      return;
    }
    try {
      const res = await toggleFavoriteEvent(event.id);
      setIsFavorite(res.favorited);
    } catch (err) {
      console.error("Error toggling favorite", err);
    }
  };


  return (

    <div className={`rounded-xl border bg-white shadow-sm transition-all duration-300 transform hover:-translate-y-1 hover:scale-[1.02] hover:shadow-xl overflow-hidden flex flex-col ${
      featured
        ? "border-orange-300 shadow-orange-100 ring-1 ring-orange-200 hover:border-orange-500"
        : "border-gray-100 hover:border-primary/50"
    }`}>


      <div className="relative">

        {featured && (
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-orange-400 via-orange-500 to-red-400 z-10" />
        )}

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
          className={`w-full object-cover transition-transform duration-300 hover:scale-[1.03] ${featured ? "h-52" : "h-48"}`}
        />


        <span className="absolute left-3 top-3 rounded bg-white px-2 py-1 text-xs font-medium">
          {event.category}
        </span>

        {featured && (
          <span className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-gradient-to-r from-orange-500 to-red-500 px-2.5 py-1 text-[11px] font-semibold text-white shadow-md">
            <Zap size={11} fill="currentColor" />
            Événement vedette
          </span>
        )}

        <button 
          onClick={handleFavoriteClick}
          className={`absolute right-3 rounded-full bg-white p-1.5 shadow-sm transition hover:scale-110 z-20 ${
            featured ? "top-12" : "top-3"
          }`}
        >
          <Heart 
            size={16} 
            className={isFavorite ? "fill-red-500 text-red-500" : "text-gray-500"} 
          />
        </button>


      </div>



      <div className="flex flex-1 flex-col p-6">


        <div className={`flex items-center gap-1 text-xs font-medium ${featured ? "text-orange-600" : "text-primary"}`}>

          <Calendar size={12} />

          {formattedDate}

          {event.time && ` • ${event.time}`}

        </div>



        <h3 className={`mt-2 font-semibold leading-snug text-gray-900 ${featured ? "text-base" : ""}`}>
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


          <span className={`font-semibold ${featured ? "text-orange-600 text-base" : "text-gray-900"}`}>
            {formatPrice()}
          </span>



          <Link
            to={`/event/${event.id}`}
            className={`text-sm font-medium hover:underline ${featured ? "text-orange-600" : "text-primary"}`}
          >
            Voir les détails
          </Link>


        </div>


      </div>


    </div>

  );
}


export default EventCard;