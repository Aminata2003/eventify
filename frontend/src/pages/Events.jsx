import { useState, useMemo } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import FilterBar from "../components/FilterSidebar";
import EventCard from "../components/EventCard";
import CategoryPills from "../components/CategoryPills";
import { mockEvents, categories } from "../data/mockEvents";

const PAGE_SIZE = 12;

export default function Events() {
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

      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl md:text-3xl font-semibold">Tous les événements</h1>
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
