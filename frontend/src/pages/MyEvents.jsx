import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CalendarX, Ticket } from "lucide-react";
import Footer from "../components/Footer";

import Navbar from "../components/Navbar";
import TicketCard from "../components/TicketCard";
import { getMyEvents } from "../services/eventService";

function MyEvents() {
  const [activeTab, setActiveTab] = useState("upcoming");
  const [myEvents, setMyEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEvents();
  }, []);

  async function loadEvents() {
    try {
      const events = await getMyEvents();
      setMyEvents(events);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  const filteredEvents = myEvents.filter((event) => {
    const eventDate = new Date(event.date);
    const today = new Date();

    return activeTab === "upcoming"
      ? eventDate >= today
      : eventDate < today;
  });

  return (
    <div className="min-h-screen bg-orange-50/30 flex flex-col">
      <Navbar />

      <div className="flex-1 max-w-4xl mx-auto w-full px-8 pt-10 pb-16">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            
            <p className="text-gray-500 mt-2">
              Gérez vos inscriptions et vos événements à venir.
            </p>
          </div>

          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setActiveTab("upcoming")}
              className={`text-sm font-medium px-4 py-2 rounded-md transition ${
                activeTab === "upcoming"
                  ? "bg-white text-primary shadow-sm"
                  : "text-gray-600"
              }`}
            >
              À venir
            </button>

            <button
              onClick={() => setActiveTab("past")}
              className={`text-sm font-medium px-4 py-2 rounded-md transition ${
                activeTab === "past"
                  ? "bg-white text-primary shadow-sm"
                  : "text-gray-600"
              }`}
            >
              Événements passés
            </button>
          </div>
        </div>

        {loading ? (
          <p className="mt-10 text-center text-gray-500">
            Chargement...
          </p>
        ) : filteredEvents.length > 0 ? (
          <div className="flex flex-col gap-4 mt-10">
            {filteredEvents.map((event) => (
              <TicketCard
                key={event.id}
                event={event}
              />
            ))}
          </div>
        ) : (          <div className="flex flex-col items-center text-center mt-16">

            <div className="relative w-48 h-48 flex items-center justify-center">

              <div className="absolute w-40 h-40 bg-white rounded-2xl shadow-sm rotate-6 flex items-center justify-center">
                <CalendarX
                  size={56}
                  strokeWidth={1.2}
                  className="text-orange-200"
                />
              </div>

              <div className="absolute -bottom-2 -left-4 w-14 h-14 bg-orange-100 rounded-xl -rotate-12 flex items-center justify-center">
                <Ticket
                  size={22}
                  className="text-primary"
                />
              </div>

            </div>

            <h2 className="text-xl font-bold text-gray-900 mt-8">

              {activeTab === "upcoming"
                ? "Aucun événement trouvé"
                : "Aucun événement passé"}

            </h2>

            <p className="text-gray-500 mt-2 max-w-md">

              {activeTab === "upcoming"
                ? "Vous n'êtes inscrit à aucun événement pour le moment. Ne manquez pas les dernières actualités de votre région !"
                : "Vous n'avez encore assisté à aucun événement."}

            </p>

            {activeTab === "upcoming" && (

              <div className="flex gap-3 mt-6">

                <Link
                  to="/"
                  className="bg-primary text-white text-sm font-medium px-5 py-2.5 rounded-lg hover:bg-orange-700 transition"
                >
                  Parcourir les événements
                </Link>

                <button
                  className="border border-gray-200 text-gray-700 text-sm font-medium px-5 py-2.5 rounded-lg hover:border-primary transition"
                >
                  Importer le calendrier
                </button>

              </div>

            )}

          </div>

        )}

      </div>
       <Footer />

    </div>

  );
  

}

export default MyEvents;