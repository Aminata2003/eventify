import { useEffect, useState, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import FilterBar from "../components/FilterSidebar";
import EventCard from "../components/EventCard";
import CategoryPills from "../components/CategoryPills";
import { mockEvents, categories } from "../data/mockEvents";

const PAGE_SIZE = 12;

function isWeekend(date) {
  const day = date.getDay();
  return day === 0 || day === 6;
}

function filterEvents(events, activeCategory, filters, searchQuery) {
  const today = new Date();
  const query = searchQuery.trim().toLowerCase();

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

    if (query) {
      const searchable = `${event.title} ${event.description} ${event.location} ${event.category}`.toLowerCase();
      if (!searchable.includes(query)) {
        return false;
      }
    }

    return true;
  });
}

export default function Events() {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeCategory, setActiveCategory] = useState("Tous les événements");
  const [filters, setFilters] = useState({ date: "", location: "" });
  const [searchQuery, setSearchQuery] = useState("");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    setSearchQuery(params.get("search") || "");
  }, [location.search]);

  const filteredEvents = useMemo(
    () => filterEvents(mockEvents, activeCategory, filters, searchQuery),
    [activeCategory, filters, searchQuery]
  );

  const visibleEvents = filteredEvents.slice(0, visibleCount);
  const hasMore = visibleCount < filteredEvents.length;

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <Navbar />

      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-semibold">Tous les événements</h1>
            <div className="text-sm text-muted mt-1">{filteredEvents.length} résultats</div>
          </div>
        </div>

        <div className="mb-6">
          <CategoryPills
            categories={categories}
            active={activeCategory}
            onSelect={(category) => {
              setActiveCategory(category);
              if (category === "Tous les événements") {
                const params = new URLSearchParams(location.search);
                params.delete("search");
                const queryString = params.toString();
                navigate(queryString ? `/events?${queryString}` : "/events", { replace: true });
                setSearchQuery("");
              }
            }}
          />
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
