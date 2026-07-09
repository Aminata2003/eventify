import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="mt-16 border-t border-gray-200 bg-white">
      <div className="mx-auto flex max-w-7xl flex-col justify-between gap-10 px-6 py-12 md:flex-row">
        <div className="max-w-sm">
          <h2 className="text-2xl font-bold text-primary">Eventify</h2>
          <p className="mt-4 text-sm leading-6 text-gray-600">
            Connecter les gens à travers des expériences extraordinaires au Sénégal.
          </p>
          <p className="mt-8 text-xs text-gray-400">
            © 2026 Eventify. Tous droits réservés.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-12 text-sm md:grid-cols-3">
          <div>
            <h3 className="mb-4 font-semibold text-gray-900">Entreprise</h3>
            <ul className="space-y-3 text-gray-600">
              <li><Link to="/" className="hover:text-primary">Accueil</Link></li>
              <li><Link to="/register-organisateur" className="hover:text-primary">Organisateurs</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="mb-4 font-semibold text-gray-900">Support</h3>
            <ul className="space-y-3 text-gray-600">
              <li><Link to="/login" className="hover:text-primary">Connexion</Link></li>
              <li><Link to="/register" className="hover:text-primary">Inscription</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="mb-4 font-semibold text-gray-900">Espaces</h3>
            <ul className="space-y-3 text-gray-600">
              <li><Link to="/my-events" className="hover:text-primary">Mes événements</Link></li>
              <li><Link to="/dashboard" className="hover:text-primary">Dashboard</Link></li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
}
