import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Footer from "../components/Footer";
import {
  CalendarDays,
  Eye,
  Users,
  Wallet,
  Plus,
  Pencil,
  Trash2,
  ImageOff,
} from "lucide-react";
import NavbarOrganizer from "../components/NavbarOrganizer";
import StatCard from "../components/StatCard";
import {
  getDashboardStats,
  getEvents,
  deleteEvent,
} from "../services/eventService";

const STATUS_STYLES = {
  published: { label: "Publié", className: "bg-green-100 text-green-700" },
  draft: { label: "Brouillon", className: "bg-stone-200 text-stone-700" },
  complet: { label: "Complet", className: "bg-red-100 text-red-700" },
};

function EventThumbnail({ src, alt }) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) {
    return (
      <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-stone-100 text-stone-300">
        <ImageOff size={16} />
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={alt}
      onError={() => setFailed(true)}
      className="h-11 w-11 rounded-lg object-cover"
    />
  );
}

function StatCardSkeleton() {
  return (
    <div className="animate-pulse rounded-xl border border-stone-200 bg-white p-5">
      <div className="h-8 w-8 rounded-lg bg-stone-100" />
      <div className="mt-4 h-3 w-24 rounded bg-stone-100" />
      <div className="mt-2 h-6 w-16 rounded bg-stone-100" />
    </div>
  );
}

function TableRowSkeleton() {
  return (
    <tr className="border-t border-stone-100">
      <td className="px-5 py-3">
        <div className="flex animate-pulse items-center gap-3">
          <div className="h-11 w-11 rounded-lg bg-stone-100" />
          <div className="space-y-2">
            <div className="h-3 w-32 rounded bg-stone-100" />
            <div className="h-2.5 w-20 rounded bg-stone-100" />
          </div>
        </div>
      </td>
      <td className="px-5 py-3">
        <div className="h-3 w-24 animate-pulse rounded bg-stone-100" />
      </td>
      <td className="px-5 py-3">
        <div className="h-5 w-16 animate-pulse rounded-full bg-stone-100" />
      </td>
      <td className="px-5 py-3">
        <div className="h-3 w-10 animate-pulse rounded bg-stone-100" />
      </td>
      <td className="px-5 py-3">
        <div className="h-3 w-12 animate-pulse rounded bg-stone-100" />
      </td>
      <td className="px-5 py-3">
        <div className="h-3 w-10 animate-pulse rounded bg-stone-100" />
      </td>
    </tr>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  function loadData() {
    setLoading(true);
    Promise.all([getDashboardStats(), getEvents()])
      .then(([statsData, eventsData]) => {
        setStats(statsData);
        setEvents(eventsData);
      })
      .finally(() => setLoading(false));
  }

  async function handleDelete(id) {
    if (!confirm("Supprimer définitivement cet événement ?")) return;
    setDeletingId(id);
    try {
      await deleteEvent(id);
      loadData();
    } finally {
      setDeletingId(null);
    }
  }

  const visibleEvents = events.slice(0, 4);

  return (
    <div className="min-h-screen bg-stone-50">
      <NavbarOrganizer active="dashboard" />

      <main className="mx-auto max-w-6xl px-6 py-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-stone-900">
              Aperçu de l'organisateur
            </h1>
            <p className="mt-1 text-sm text-stone-500">
              Gérez votre portefeuille d'événements professionnels et suivez
              les performances en temps réel.
            </p>
          </div>
          <button
            onClick={() => navigate("/create-event")}
            className="flex items-center gap-2 rounded-lg bg-[#f6682f] px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-[#ea580c]"
          >
            <Plus size={16} /> Créer un événement
          </button>
        </div>

        {/* Stats */}
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {loading || !stats ? (
            <>
              <StatCardSkeleton />
              <StatCardSkeleton />
              <StatCardSkeleton />
              <StatCardSkeleton />
            </>
          ) : (
            <>
              <StatCard
                icon={CalendarDays}
                label="Total des événements"
                value={stats.total_events}
                change={stats.total_events_change}
                iconBg="bg-red-50"
                iconColor="text-red-600"
              />
              <StatCard
                icon={Eye}
                label="Vues de page"
                value={stats.page_views.toLocaleString("fr-FR")}
                change={stats.page_views_change}
                iconBg="bg-sky-50"
                iconColor="text-sky-600"
              />
              <StatCard
                icon={Users}
                label="Inscriptions"
                value={stats.registrations}
                change={stats.registrations_change}
                iconBg="bg-violet-50"
                iconColor="text-violet-600"
              />
              <StatCard
                icon={Wallet}
                label="Revenu total"
               value={`${stats.revenue.toLocaleString("fr-FR")} FCFA`}
                change={stats.revenue_change}
                iconBg="bg-emerald-50"
                iconColor="text-emerald-600"
              />
            </>
          )}
        </div>

        {/* Table des événements */}
        <div className="mt-8 overflow-hidden rounded-xl border border-stone-200 bg-white">
          <div className="flex items-center justify-between border-b border-stone-100 px-5 py-4">
            <h2 className="font-semibold text-stone-900">
              Événements actifs
            </h2>
            {!loading && (
              <span className="text-xs text-stone-400">
                {events.length} au total
              </span>
            )}
          </div>

          <table className="w-full text-left text-sm">
            <thead className="text-xs uppercase tracking-wide text-stone-400">
              <tr>
                <th className="px-5 py-3 font-medium">Titre de l'événement</th>
                <th className="px-5 py-3 font-medium">Date et heure</th>
                <th className="px-5 py-3 font-medium">Statut</th>
                <th className="px-5 py-3 font-medium">Vues</th>
                <th className="px-5 py-3 font-medium">Inscr.</th>
                <th className="px-5 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <>
                  <TableRowSkeleton />
                  <TableRowSkeleton />
                  <TableRowSkeleton />
                  <TableRowSkeleton />
                </>
              ) : visibleEvents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center">
                    <p className="text-sm text-stone-500">
                      Aucun événement pour le moment.
                    </p>
                   
                  </td>
                </tr>
              ) : (
                visibleEvents.map((event) => {
                  const fillRate = Math.min(
                    100,
                    Math.round(
                      (event.registrations_count / event.capacity) * 100
                    )
                  );
                  return (
                    <tr
                      key={event.id}
                      className="border-t border-stone-100 transition-colors hover:bg-stone-50"
                    >
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <EventThumbnail src={event.image} alt={event.title} />
                          <div className="min-w-0">
                            <Link
                              to={`/event/${event.id}`}
                         className="block truncate font-medium text-stone-900 hover:bg-[#ea580c]"
                          >
                            {event.title}
                           </Link>
                            <p className="truncate text-xs text-stone-400">
                              {event.location}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-5 py-3 text-stone-500">
                        {event.date} • {event.time}
                      </td>
                      <td className="px-5 py-3">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                            STATUS_STYLES[event.status]?.className ??
                            "bg-stone-100 text-stone-600"
                          }`}
                        >
                          {STATUS_STYLES[event.status]?.label ?? event.status}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-stone-500">
                        {event.views_count.toLocaleString("fr-FR")}
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <span className="text-stone-500">
                            {event.registrations_count}/{event.capacity}
                          </span>
                          <div className="hidden h-1.5 w-14 overflow-hidden rounded-full bg-stone-100 sm:block">
                            <div
                              className={`h-full rounded-full ${
                                fillRate >= 100
                                  ? "bg-red-500"
                                  : fillRate >= 70
                                  ? "bg-amber-500"
                                  : "bg-emerald-500"
                              }`}
                              style={{ width: `${fillRate}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex gap-1">
                          <button
                            onClick={() =>
                              navigate(`/create-event?edit=${event.id}`)
                            }
                            className="rounded p-1.5 text-stone-500 transition-colors hover:hover:bg-[#ea580c]"
                            aria-label="Modifier"
                          >
                            <Pencil size={15} />
                          </button>
                          <button
                            onClick={() => handleDelete(event.id)}
                            disabled={deletingId === event.id}
                            className="rounded p-1.5 text-red-500 transition-colors hover:bg-[#f6682f]/10 disabled:opacity-50"
                            aria-label="Supprimer"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>

          {!loading && (
            <div className="flex items-center justify-between border-t border-stone-100 px-5 py-3 text-xs text-stone-400">
              <span>
                Affichage de {visibleEvents.length} sur {events.length}{" "}
                événements
              </span>
              <div className="flex gap-2">
                <button
                  className="rounded-lg border border-stone-300 px-3 py-1.5 text-stone-400"
                  disabled
                >
                  Précédent
                </button>
                <button className="rounded-lg border border-stone-300 px-3 py-1.5 text-stone-700 transition-colors hover:bg-stone-100">
                  Suivant
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
