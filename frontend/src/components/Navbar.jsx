import { Search } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function NavbarPublic() {
  const { user, logout } = useAuth();
  const firstName = user?.name || user?.email?.split("@")[0] || "Utilisateur";

  return (
    <nav className="sticky top-0 z-50 border-b border-gray-100 bg-white/70 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-3">
        <div className="flex items-center gap-6">
          <Link to="/" className="text-2xl font-bold text-primary">
            Eventify
          </Link>
          <div className="hidden gap-6 text-sm font-medium text-gray-700 md:flex">
            <Link to="/" className="border-b-2 border-primary pb-1 text-primary">
              Trouver des événements
            </Link>
            <Link to="/my-events" className="hover:text-primary">
              Mes événements
            </Link>
            {user?.role === "organizer" && (
              <Link to="/dashboard" className="hover:text-primary">
                Dashboard
              </Link>
            )}
            {!user && (
              <Link to="/register-organisateur" className="hover:text-primary">
                Devenir organisateur
              </Link>
            )}
          </div>
        </div>

        <div className="mx-4 hidden w-full max-w-md flex-1 items-center rounded-full bg-white/90 px-4 py-2 shadow-sm ring-1 ring-gray-100 transition focus-within:ring-2 focus-within:ring-orange-300 sm:flex">
          <Search size={18} className="mr-2 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher événements, villes, artistes..."
            className="w-full bg-transparent text-sm outline-none placeholder-gray-400"
          />
        </div>

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
