import { Search, Bell } from "lucide-react";
import { Link, NavLink, useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { getNotifications, markNotificationAsRead } from "../services/eventService";

function NavbarPublic() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchInput, setSearchInput] = useState("");
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const firstName = user?.name || user?.email?.split("@")[0] || "Utilisateur";

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  useEffect(() => {
    if (location.pathname === "/events") {
      const params = new URLSearchParams(location.search);
      setSearchInput(params.get("search") || "");
    }
  }, [location.pathname, location.search]);

  useEffect(() => {
    if (user) {
      loadNotifications();
    } else {
      setNotifications([]);
    }
  }, [user, location.pathname]);

  const loadNotifications = async () => {
    try {
      const data = await getNotifications();
      setNotifications(data);
    } catch (err) {
      console.error("Failed to load notifications", err);
    }
  };

  const handleNotificationClick = async (notif) => {
    if (!notif.is_read) {
      try {
        await markNotificationAsRead(notif.id);
        setNotifications((prev) =>
          prev.map((n) => (n.id === notif.id ? { ...n, is_read: true } : n))
        );
      } catch (err) {
        console.error("Failed to mark notification as read", err);
      }
    }
    setShowNotifications(false);
    if (notif.event) {
      navigate(`/events/${notif.event}`);
    }
  };

  const handleMarkAllAsRead = async () => {
    const unread = notifications.filter((n) => !n.is_read);
    try {
      await Promise.all(unread.map((n) => markNotificationAsRead(n.id)));
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch (err) {
      console.error("Failed to mark all as read", err);
    }
  };

  function handleSubmit(event) {
    event.preventDefault();
    const query = searchInput.trim();
    if (query) {
      navigate(`/events?search=${encodeURIComponent(query)}`);
    } else {
      navigate("/events");
    }
  }

  return (
    <nav className="sticky top-0 z-50 border-b border-gray-100 bg-white/70 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-3">
        <div className="flex items-center gap-6">
          <Link to="/" className="text-2xl font-bold text-primary">
            Eventify
          </Link>
          <div className="hidden gap-6 text-sm font-medium text-gray-700 md:flex">
            <NavLink
              to="/events"
              className={({ isActive }) =>
                isActive
                  ? "border-b-2 border-primary pb-1 text-primary"
                  : "hover:text-primary"
              }
            >
              Trouver des événements
            </NavLink>

            <NavLink
              to="/my-events"
              className={({ isActive }) =>
                isActive ? "border-b-2 border-primary pb-1 text-primary" : "hover:text-primary"
              }
            >
              Mes événements
            </NavLink>
            {user?.role === "organizer" && (
              <NavLink
                to="/dashboard"
                className={({ isActive }) =>
                  isActive ? "border-b-2 border-primary pb-1 text-primary" : "hover:text-primary"
                }
              >
                Dashboard
              </NavLink>
            )}
            {!user && (
              <NavLink
                to="/register-organisateur"
                className={({ isActive }) =>
                  isActive ? "border-b-2 border-primary pb-1 text-primary" : "hover:text-primary"
                }
              >
                Devenir organisateur
              </NavLink>
            )}
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="mx-4 hidden w-full max-w-md flex-1 items-center rounded-full bg-white/90 px-4 py-2 shadow-sm ring-1 ring-gray-100 transition focus-within:ring-2 focus-within:ring-orange-300 sm:flex"
        >
          <Search size={18} className="mr-2 text-gray-400" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Rechercher événements, villes, artistes..."
            className="w-full bg-transparent text-sm outline-none placeholder-gray-400"
          />
        </form>

        <div className="flex items-center gap-4 relative">
          {user ? (
            <>
              {/* Bouton notifications */}
              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative p-2 rounded-full hover:bg-gray-100 text-gray-600 hover:text-primary transition"
                  aria-label="Notifications"
                >
                  <Bell size={20} />
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-500 rounded-full">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {/* Dropdown de Notifications */}
                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 rounded-xl bg-white border border-gray-100 shadow-xl py-2 z-50 max-h-96 overflow-y-auto">
                    <div className="px-4 py-2 border-b border-gray-100 flex items-center justify-between">
                      <h4 className="font-semibold text-gray-900 text-sm">Notifications</h4>
                      {unreadCount > 0 && (
                        <button
                          onClick={handleMarkAllAsRead}
                          className="text-xs text-primary font-medium hover:underline"
                        >
                          Tout lire
                        </button>
                      )}
                    </div>
                    {notifications.length === 0 ? (
                      <div className="px-4 py-6 text-center text-xs text-gray-400">
                        Aucune notification
                      </div>
                    ) : (
                      <div className="divide-y divide-gray-50">
                        {notifications.map((notif) => (
                          <div
                            key={notif.id}
                            onClick={() => handleNotificationClick(notif)}
                            className={`px-4 py-3 hover:bg-gray-50 transition cursor-pointer text-left ${
                              !notif.is_read ? "bg-orange-50/20" : ""
                            }`}
                          >
                            <p className={`text-xs text-gray-700 ${!notif.is_read ? "font-semibold text-gray-950" : ""}`}>
                              {notif.message}
                            </p>
                            <span className="text-[10px] text-gray-400 mt-1 block">
                              {new Date(notif.created_at).toLocaleDateString("fr-FR", {
                                day: "2-digit",
                                month: "short",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <span className="hidden text-sm text-gray-700 sm:inline">
                Bonjour, {firstName}
              </span>
              <button
                onClick={logout}
                className="text-sm font-medium text-gray-700 hover:text-primary"
              >
                Se déconnecter
              </button>
            </>
          ) : (
            <Link
              to="/login"
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition hover:bg-orange-600"
            >
              Connexion
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}

export default NavbarPublic;