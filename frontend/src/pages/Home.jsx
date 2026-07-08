import { useState, useMemo } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import FilterBar from "../components/FilterSidebar";
import EventCard from "../components/EventCard";
import CategoryPills from "../components/CategoryPills";
import { mockEvents, categories } from "../data/mockEvents";
import heroImg from "../assets/image.png";

const PAGE_SIZE = 6;

function Home() {
  const [activeCategory, setActiveCategory] = useState("Tous les événements");
  const [filters, setFilters] = useState({ date: "", location: "" });
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const filteredEvents = useMemo(() => {
    return mockEvents.filter((e) =>
      activeCategory === "Tous les événements" ? true : e.category === activeCategory
    );
  }, [activeCategory]);

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
            <FilterBar filters={filters} setFilters={setFilters} onSelectCategory={setActiveCategory} />
          </div>
        </div>
      </section>

      {/* Content */}
      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg md:text-2xl font-semibold">Événements populaires</h2>
          <div className="text-sm text-muted">{filteredEvents.length} résultats</div>
        </div>

        <div className="mb-6">
          <CategoryPills categories={categories} active={activeCategory} onSelect={setActiveCategory} />
        </div>

        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {visibleEvents.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </section>

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
      </main>
      <Footer />
    </div>
  );
}

export default Home;