import { Search } from "lucide-react";
import { Link, NavLink, useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";

function NavbarPublic() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchInput, setSearchInput] = useState("");
  const firstName = user?.name || user?.email?.split("@")[0] || "Utilisateur";

  useEffect(() => {
    if (location.pathname === "/events") {
      const params = new URLSearchParams(location.search);
      setSearchInput(params.get("search") || "");
    }
  }, [location.pathname, location.search]);

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

            {/* Nouveau lien Mises à jour */}
            <NavLink
              to="/updates"
              className={({ isActive }) =>
                isActive
                  ? "border-b-2 border-primary pb-1 text-primary"
                  : "hover:text-primary"
              }
            >
              Mises à jour
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

        <div className="flex items-center gap-4">
          {user ? (
            <>
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