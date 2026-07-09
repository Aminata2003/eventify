import { Heart, MapPin, Calendar } from "lucide-react";
import { Link } from "react-router-dom";
<<<<<<<<< Temporary merge branch 1


function EventCard({ event }) {

  console.log("PRIX :", event.price, "TYPE :", typeof event.price);

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

    // Si le prix est déjà un texte comme "10 000 FCFA"
    if (typeof event.price === "string" && isNaN(Number(event.price))) {
      return event.price;
    }

    const price = Number(event.price);

    if (price === 0) {
      return "Gratuit";
    }

    return `${price.toLocaleString("fr-FR")} ${event.price_currency || "FCFA"}`;
  };


  return (

    <div className="rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow overflow-hidden bg-white flex flex-col">


      <div className="relative">

        <img
          src={
            event.image ||
            "https://via.placeholder.com/600x400"
          }
          alt={event.title}
          className="w-full h-48 object-cover"
        />


        <span className="absolute top-3 left-3 bg-white text-xs font-medium px-2 py-1 rounded">
          {event.category}
        </span>


        <button className="absolute top-3 right-3 bg-white rounded-full p-1.5">
          <Heart size={16} className="text-gray-500"/>
=========

function EventCard({ event }) {
  const formattedDate = event.date
    ? new Date(event.date).toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      })
    : "";

  return (
    <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm transition-shadow hover:shadow-md flex flex-col">
      <div className="relative">
        <img
          src={event.image}
          alt={event.title}
          className="h-48 w-full object-cover"
        />

        <span className="absolute left-3 top-3 rounded bg-white px-2 py-1 text-xs font-medium">
          {event.category}
        </span>

        <button className="absolute right-3 top-3 rounded-full bg-white p-1.5">
          <Heart size={16} className="text-gray-500" />
        </button>


      </div>

<<<<<<<<< Temporary merge branch 1


      <div className="p-6 flex flex-col flex-1">


        <div className="flex items-center gap-1 text-xs text-primary font-medium">

          <Calendar size={12}/>

          {new Date(event.date).toLocaleDateString("fr-FR")}

          {" · "}

          {event.time}

=========
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
          {event.location}
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
            {event.price > 0
              ? `${event.price.toLocaleString("fr-FR")} FCFA`
              : "Gratuit"}
          </span>

          <Link
            to={`/event/${event.id}`}
            className="text-sm font-medium text-primary hover:underline"
          >
            Voir les détails
          </Link>
>>>>>>>>> Temporary merge branch 2
        </div>



        <h3 className="font-semibold text-gray-900 mt-2">
          {event.title}
        </h3>



        <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">

          <MapPin size={12}/>

          {event.venue || event.location}

        </div>



        <p className="text-sm text-gray-500 mt-2 line-clamp-2">
          {event.description}
        </p>



        <div className="flex items-center justify-between mt-4 pt-3 border-t">

          <span className="font-semibold">
            {formatPrice()}
          </span>


          <Link
            to={`/event/${event.id}`}
            className="text-sm font-medium text-primary hover:underline"
          >
            Voir
          </Link>

        </div>


      </div>


    </div>

  );
}


export default EventCard;