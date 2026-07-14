import { useEffect, useMemo, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Download, Search, Filter, ArrowUpDown, ChevronLeft, ChevronRight } from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import {
  getEventById,
  getParticipants,
  exportParticipantsCSV,
} from "../services/eventService";
import { useAuth } from "../context/AuthContext";

const STATUS_STYLES = {
  confirmed: { label: "Confirmé", className: "bg-green-100 text-green-700" },
  pending: { label: "En attente", className: "bg-stone-200 text-stone-700" },
  waitlist: { label: "Liste d'attente", className: "bg-red-100 text-red-700" },
};

const PAGE_SIZE = 5;

export default function ParticipantsList() {
  const rawEventId = useParams().eventId;
  const eventId = rawEventId && rawEventId !== "undefined" ? (isNaN(Number(rawEventId)) ? rawEventId : Number(rawEventId)) : null;
  const navigate = useNavigate();
  const { user } = useAuth();
  const [event, setEvent] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([getEventById(eventId), getParticipants(eventId)])
      .then(([eventData, participantsData]) => {
        // Faille 3 : rediriger si l'événement n'appartient pas à l'organisateur connecté
        if (user && eventData.organizer?.id !== user.id) {
          navigate("/dashboard", { replace: true });
          return;
        }
        setEvent(eventData);
        setParticipants(participantsData);
      })
      .finally(() => setLoading(false));
  }, [eventId]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return participants;
    return participants.filter(
      (p) =>
        p.name.toLowerCase().includes(q) || p.email.toLowerCase().includes(q)
    );
  }, [participants, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const totalParticipants = event?.registrations_count ?? participants.length;
  const presents = participants.filter((p) => p.status === "confirmed").length;
  const capacity = event?.capacity ?? 1;
  const progressPct = Math.min(
    100,
    Math.round((totalParticipants / capacity) * 100)
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50">
        <Navbar active="dashboard" />
        <p className="mx-auto max-w-5xl px-6 py-16 text-center text-stone-500">
          Chargement des participants...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <Navbar active="dashboard" />

      <main className="mx-auto max-w-5xl px-6 py-8">
        <p className="text-xs text-stone-400">
          <Link to="/dashboard" className="hover:underline">
            Événements
          </Link>{" "}
          &gt; {event?.title}
        </p>
        <div className="mt-1 flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-bold text-stone-900">{event?.title}</h1>
          <button
            onClick={() => exportParticipantsCSV(eventId, filtered)}
            className="flex items-center gap-2 rounded-lg border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-100"
          >
            <Download size={16} /> Exporter CSV
          </button>
        </div>
        <p className="mt-1 text-sm text-stone-500">
          {event?.date} • {event?.location}
        </p>

        {/* Stats */}
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-stone-200 bg-white p-5">
            <p className="text-xs uppercase tracking-wide text-stone-400">
              Total participants
            </p>
            <p className="mt-1 text-2xl font-bold text-red-600">
              {totalParticipants}
            </p>
          </div>
          <div className="rounded-xl border border-stone-200 bg-white p-5">
            <p className="text-xs uppercase tracking-wide text-stone-400">
              Présents
            </p>
            <p className="mt-1 text-2xl font-bold text-stone-900">
              {presents}
            </p>
          </div>
          <div className="rounded-xl bg-[#f6682f] p-5 text-white">
            <p className="text-xs uppercase tracking-wide text-red-100">
              Objectif d'inscription
            </p>
            <p className="mt-1 text-2xl font-bold">{progressPct}%</p>
            <div className="mt-2 h-1.5 w-full rounded-full bg-red-400/50">
              <div
                className="h-1.5 rounded-full bg-white"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <p className="mt-1 text-xs text-red-100">
              {totalParticipants} / {capacity}
            </p>
          </div>
        </div>

        {/* Recherche + filtres */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <div className="relative w-full max-w-xs">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Rechercher par nom ou email..."
              className="w-full rounded-lg border border-stone-300 bg-white py-2 pl-9 pr-3 text-sm placeholder:text-stone-400 focus:bg-[#f6682f] focus:outline-none focus:ring-1 focus:ring-red-500"
            />
          </div>
          <div className="flex gap-2">
            <button className="flex items-center gap-1.5 rounded-lg border border-stone-300 px-3 py-2 text-sm text-stone-700 hover:bg-stone-100">
              <Filter size={14} /> Filtres
            </button>
            <button className="flex items-center gap-1.5 rounded-lg border border-stone-300 px-3 py-2 text-sm text-stone-700 hover:bg-stone-100">
              <ArrowUpDown size={14} /> Trier
            </button>
          </div>
        </div>

       {/* Tableau */}
        <div className="mt-4 rounded-xl border border-stone-200 bg-white overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm min-w-[600px]">

    <thead className="bg-stone-50 text-xs uppercase tracking-wide text-stone-400">
      <tr>
        <th className="px-5 py-3 font-medium">
          Nom
        </th>

        <th className="px-5 py-3 font-medium">
          Email
        </th>

        <th className="px-5 py-3 font-medium">
          Date d'inscription
        </th>

        <th className="px-5 py-3 font-medium">
          Statut
        </th>
      </tr>
    </thead>


    <tbody>

      {paginated.map((p) => (

        <tr key={p.id} className="border-t border-stone-100">

          <td className="flex items-center gap-2 px-5 py-3">

            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-red-100 text-xs font-semibold text-red-700">

              {p.name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .slice(0, 2)}

            </span>

            {p.name}

          </td>


          <td className="px-5 py-3 text-stone-500">
            {p.email}
          </td>


          <td className="px-5 py-3 text-stone-500">
            {p.registered_at}
          </td>



          <td className="px-5 py-3">
            <span
              className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                STATUS_STYLES[p.status]?.className ??
                "bg-stone-100 text-stone-600"
              }`}
            >
              {STATUS_STYLES[p.status]?.label ?? p.status}
            </span>
          </td>


        </tr>

      ))}



      {paginated.length === 0 && (

        <tr>

          <td
            colSpan={4}
            className="px-5 py-8 text-center text-stone-400"
          >

            Aucun participant ne correspond à cette recherche.

          </td>

        </tr>

      )}


    </tbody>

  </table>
        </div>

          

        {/* Pagination */}
        <div className="flex items-center justify-between border-t border-stone-100 px-5 py-3 text-xs text-stone-400">

          <span>
            Affichage {paginated.length ? (page - 1) * PAGE_SIZE + 1 : 0}-
            {(page - 1) * PAGE_SIZE + paginated.length} sur {filtered.length} participants
          </span>

          <div className="flex items-center gap-2">

            {/* Bouton précédent */}
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className={`flex h-9 w-9 items-center justify-center rounded-lg border transition ${
                page === 1
                  ? "cursor-not-allowed border-stone-200 text-stone-300"
                  : "border-stone-300 text-stone-600 hover:border-[#f6682f] hover:bg-[#f6682f]/10 hover:text-[#f6682f]"
              }`}
            >
              <ChevronLeft size={18} />
            </button>


            {/* Numéros */}
            {Array.from({ length: totalPages }).map((_, i) => {
              const current = i + 1;

              return (
                <button
                  key={current}
                  onClick={() => setPage(current)}
                  className={`flex h-9 w-9 items-center justify-center rounded-lg border text-sm font-semibold transition ${
                    page === current
                      ? "border-[#f6682f] bg-[#f6682f] text-white shadow-md"
                      : "border-stone-300 text-stone-700 hover:border-[#f6682f] hover:bg-[#f6682f]/10 hover:text-[#f6682f]"
                  }`}
                >
                  {current}
                </button>
              );
            })}


            {/* Bouton suivant */}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className={`flex h-9 w-9 items-center justify-center rounded-lg border transition ${
                page === totalPages
                  ? "cursor-not-allowed border-stone-200 text-stone-300"
                  : "border-stone-300 text-stone-600 hover:border-[#f6682f] hover:bg-[#f6682f]/10 hover:text-[#f6682f]"
              }`}
            >
              <ChevronRight size={18} />
            </button>

          </div>

        </div>

         </div>
        
      </main>
      <Footer />
    </div>
  );
}
