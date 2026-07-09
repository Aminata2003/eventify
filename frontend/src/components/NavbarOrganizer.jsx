import { Link, useNavigate } from "react-router-dom";
import { LayoutDashboard, ClipboardList, LogOut } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function NavbarOrganizer({ active = "" }) {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const links = [
    { key: "dashboard", label: "Dashboard", to: "/dashboard", icon: LayoutDashboard },
    { key: "tracking", label: "Suivi événement", to: "/dashboard/1/participants", icon: ClipboardList },
  ];

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link to="/dashboard" className="text-lg font-bold tracking-tight text-primary">
          Eventify
        </Link>

        <nav className="hidden items-center gap-6 text-sm font-medium text-gray-600 md:flex">
          {links.map((link) => {
            const Icon = link.icon;
            const isActive = active === link.key;
            return (
              <Link
                key={link.key}
                to={link.to}
                className={`flex items-center gap-1.5 transition-colors ${
                  isActive ? "text-primary" : "hover:text-gray-900"
                }`}
              >
                <Icon size={16} />
                {link.label}
              </Link>
            );
          })}
        </nav>

        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
        >
          <LogOut size={16} />
          Déconnexion
        </button>
      </div>

      <nav className="flex items-center justify-around border-t border-gray-200 py-2 text-xs font-medium text-gray-600 md:hidden">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = active === link.key;
          return (
            <Link
              key={link.key}
              to={link.to}
              className={`flex flex-col items-center gap-0.5 ${isActive ? "text-primary" : ""}`}
            >
              <Icon size={18} />
              {link.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}