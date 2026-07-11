import { useEffect, useState, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import FilterBar from "../components/FilterSidebar";
import EventCard from "../components/EventCard";
import CategoryPills from "../components/CategoryPills";
import { getEvents } from "../services/eventService";

const PAGE_SIZE = 12;


function isWeekend(date) {
  const day = date.getDay();
  return day === 0 || day === 6;
}


function normalize(str) {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}


function filterEvents(events, activeCategory, filters, searchQuery) {

  const today = new Date();
  const query = searchQuery ? normalize(searchQuery.trim()) : "";


  return events.filter((event) => {


    if (
      activeCategory !== "Tous les événements" &&
      event.category !== activeCategory
    ) {
      return false;
    }


    if (
      filters.location &&
      event.location !== filters.location
    ) {
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


      if (
        filters.date === "weekend" &&
        !isWeekend(eventDate)
      ) {
        return false;
      }

    }



    // Filtre local complémentaire
    if (query) {

      const searchable = normalize(
        [
          event.title,
          event.description,
          event.location,
          event.venue,
          event.category
        ]
          .filter(Boolean)
          .join(" ")
      );


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


  const [events, setEvents] = useState([]);

  const [activeCategory, setActiveCategory] = useState(
    "Tous les événements"
  );

  const [filters, setFilters] = useState({
    date: "",
    location: ""
  });


  const [searchQuery, setSearchQuery] = useState("");

  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);



  // Récupération du texte de recherche dans l'URL
  useEffect(() => {

    const params = new URLSearchParams(location.search);

    setSearchQuery(
      params.get("search") || ""
    );

  }, [location.search]);




  // Appel API Backend via service
  useEffect(() => {
    let cancelled = false;
    async function fetchEvents() {
      try {
        const data = await getEvents(searchQuery);
        if (!cancelled) setEvents(data);
      } catch (error) {
        console.error("Erreur récupération événements :", error);
      }
    }
    fetchEvents();
    return () => {
      cancelled = true;
    };
  }, [searchQuery]);





  const filteredEvents = useMemo(

    () =>
      filterEvents(
        events,
        activeCategory,
        filters,
        searchQuery
      ),

    [
      events,
      activeCategory,
      filters,
      searchQuery
    ]

  );




  const visibleEvents =
    filteredEvents.slice(0, visibleCount);



  const hasMore =
    visibleCount < filteredEvents.length;




  const clearSearch = () => {

    const params =
      new URLSearchParams(location.search);


    params.delete("search");


    const queryString =
      params.toString();


    navigate(
      queryString
        ? `/events?${queryString}`
        : "/events",
      {
        replace: true
      }
    );


    setSearchQuery("");

  };

  // derive categories and locations from loaded events
  const derivedCategories = useMemo(() => {
    const set = new Set(events.map((e) => e.category).filter(Boolean));
    return ["Tous les événements", ...Array.from(set)];
  }, [events]);

  const derivedLocations = useMemo(() => {
    const set = new Set(events.map((e) => e.location).filter(Boolean));
    return ["Sénégal (Tous)", ...Array.from(set)];
  }, [events]);




  return (

    <div className="min-h-screen bg-white text-gray-900">


      <Navbar />


      <main className="max-w-6xl mx-auto px-6 py-8">


        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">


          <div>


            <h1 className="text-2xl md:text-3xl font-semibold">

              {
                searchQuery
                  ? `Résultats pour "${searchQuery}"`
                  : "Tous les événements"
              }

            </h1>


            <div className="text-sm text-muted mt-1 flex items-center gap-3">


              {filteredEvents.length} résultats


              {searchQuery && (

                <button
                  onClick={clearSearch}
                  className="text-primary underline text-sm"
                >

                  Effacer la recherche

                </button>

              )}

            </div>


          </div>


        </div>





        <div className="mb-6">

          <FilterBar
            filters={filters}
            setFilters={setFilters}
            locations={derivedLocations}
          />

        </div>





        <div className="mb-6">

          <CategoryPills
            categories={derivedCategories}
            active={activeCategory}
            onSelect={(category) => {
              setActiveCategory(category);
              if (category === "Tous les événements") {
                clearSearch();
              }
            }}
          />

        </div>





        {
          visibleEvents.length > 0 ? (

            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">


              {
                visibleEvents.map((event) => (

                  <EventCard
                    key={event.id}
                    event={event}
                  />

                ))
              }


            </section>


          ) : (


            <div className="text-center py-16 text-gray-500">

              Aucun événement ne correspond à votre recherche.

            </div>


          )
        }






        {
          hasMore && (

            <div className="flex justify-center mt-8">

              <button

                onClick={() =>
                  setVisibleCount(
                    (v) => v + PAGE_SIZE
                  )
                }

                className="px-6 py-2 rounded-md border border-primary text-primary"

              >

                Charger plus

              </button>


            </div>

          )
        }



      </main>


      <Footer />


    </div>

  );

}