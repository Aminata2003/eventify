import { Heart, MapPin, Calendar } from "lucide-react";
import { Link } from "react-router-dom";


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
        </button>


      </div>



      <div className="p-6 flex flex-col flex-1">


        <div className="flex items-center gap-1 text-xs text-primary font-medium">

          <Calendar size={12}/>

          {new Date(event.date).toLocaleDateString("fr-FR")}

          {" · "}

          {event.time}

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