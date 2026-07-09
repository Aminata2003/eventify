import { useState, useMemo, useEffect } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import FilterBar from "../components/FilterSidebar";
import EventCard from "../components/EventCard";
import CategoryPills from "../components/CategoryPills";
import { getEvents } from "../services/eventService";
import heroImg from "../assets/image.png";

const PAGE_SIZE = 6;

// Liste des catégories affichées dans les filtres. Ce n'est pas de la
// "donnée métier" à proprement parler (pas d'id, pas de contenu propre à
// un événement) donc pas besoin de backend pour ça — on la garde en dur ici.
const CATEGORIES = [
  "Tous les événements",
  "Musique",
  "Atelier",
  "Gastronomie",
  "Arts",
  "Affaires",
  "Bien-être",
  "Sports",
];

function isWeekend(date) {
  const day = date.getDay();
  return day === 0 || day === 6;
}

function filterEvents(events, activeCategory, filters) {
  const today = new Date();

  return events.filter((event) => {
    if (activeCategory !== "Tous les événements" && event.category !== activeCategory) {
      return false;
    }

    if (filters.location && event.location !== filters.location) {
      return false;
    }

    if (filters.date) {
      const eventDate = new Date(`${event.date}T00:00:00`);
      if (filters.date === "today") {
        if (
          eventDate.getFullYear() !== today.getFullYear() ||
          eventDate.getMonth() !== today.getMonth() ||
          eventDate.getDate() !== today.getDate()
        ) {
          return false;
        }
      }

      if (filters.date === "weekend" && !isWeekend(eventDate)) {
        return false;
      }
    }

    return true;
  });
}

function Home() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("Tous les événements");
  const [filters, setFilters] = useState({ date: "", location: "" });
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getEvents()
      .then((data) => !cancelled && setEvents(data))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  const filteredEvents = useMemo(
    () => filterEvents(events, activeCategory, filters),
    [events, activeCategory, filters]
  );

  const visibleEvents = filteredEvents.slice(0, visibleCount);
  const hasMore = visibleCount < filteredEvents.length;

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <Navbar />

      {/* Hero */}
      <section className="relative w-full">
        <img src={heroImg} alt="Événements" className="w-full h-[320px] md:h-[440px] object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute inset-0 flex items-end">
          <div className="max-w-prose ml-6 md:ml-12 px-6 py-12 md:py-20 text-left">
            <h1 className="text-2xl md:text-4xl font-semibold text-white leading-tight max-w-prose">
              Des moments inoubliables, <span className="text-primary">plus proches que jamais</span>
            </h1>
            <p className="text-sm md:text-base text-gray-200 mt-4 max-w-prose leading-relaxed">
              Trouvez et réservez facilement des concerts, ateliers et rencontres au Sénégal.
            </p>
          </div>
        </div>
      </section>

      {/* Filters (overlay card) */}
      <section className="w-full -mt-12 relative z-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="bg-white rounded-xl shadow-md p-4">
            <FilterBar filters={filters} setFilters={setFilters} />
            <main id="results-section" className="max-w-6xl mx-auto px-6 py-8"></main>
          </div>
        </div>
      </section>

      {/* Content */}
      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg md:text-2xl font-semibold">Événements populaires</h2>
          <div className="text-sm text-muted">
            {loading ? "…" : `${filteredEvents.length} résultats`}
          </div>
        </div>

        <div className="mb-6">
          <CategoryPills categories={CATEGORIES} active={activeCategory} onSelect={setActiveCategory} />
        </div>

        {loading ? (
          <p className="text-center text-sm text-gray-400 py-12">
            Chargement des événements...
          </p>
        ) : (
          <>
            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {visibleEvents.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </section>

            {visibleEvents.length === 0 && (
              <p className="text-center text-sm text-gray-400 py-12">
                Aucun événement ne correspond à ces critères.
              </p>
            )}

            {hasMore && (
              <div className="flex justify-center mt-8">
                <button
                  onClick={() => setVisibleCount((v) => v + PAGE_SIZE)}
                  className="px-6 py-2 rounded-md border border-primary text-primary"
                >
                  Charger plus
                </button>
              </div>
            )}
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}

export default Home;
