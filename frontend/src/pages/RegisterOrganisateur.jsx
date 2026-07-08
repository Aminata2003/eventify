import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Calendar, Building2, Mail, Lock, TrendingUp, BarChart3 } from "lucide-react";
import { registerOrganizer } from "../services/eventService";

export default function RegisterOrganisateur() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    acceptedTerms: false,
  });
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  function handleChange(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);

    if (!form.name.trim() || !form.email.trim() || !form.password) {
      setError("Merci de remplir tous les champs.");
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }
    if (!form.acceptedTerms) {
      setError("Merci d'accepter les Conditions Générales pour continuer.");
      return;
    }

    setSubmitting(true);
    try {
      await registerOrganizer({
        name: form.name,
        email: form.email,
        password: form.password,
        role: "organizer",
      });
      navigate("/dashboard");
    } catch {
      setError("Une erreur est survenue, réessaie dans un instant.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center bg-stone-50 px-4 py-10">
      <Link to="/" className="flex items-center gap-2 text-[#f6682f]">
        <span className="text-lg font-bold">Eventify</span>
      </Link>

      <div className="mt-6 w-full max-w-sm rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
        <span className="inline-block rounded-full bg-[#f6682f]/10 px-3 py-1 text-xs font-medium text-[#f6682f]">
          Compte Organisateur
        </span>
        <h1 className="mt-3 text-xl font-bold text-stone-900">
          Créer un compte
        </h1>
        <p className="mt-1 text-sm text-stone-500">
          Rejoignez la communauté d'organisateurs d'élite sur Eventify.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-stone-800">
              Nom complet / Nom de l'organisation
            </label>
            <div className="relative mt-1.5">
              <Building2
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400"
              />
              <input
                type="text"
                value={form.name}
                onChange={(e) => handleChange("name", e.target.value)}
                placeholder="Ex: Agence Creative ou Jean Dupont"
                className="w-full rounded-lg border border-stone-300 bg-stone-50 py-2.5 pl-9 pr-3 text-sm placeholder:text-stone-400 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-800">
              Email professionnel
            </label>
            <div className="relative mt-1.5">
              <Mail
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400"
              />
              <input
                type="email"
                value={form.email}
                onChange={(e) => handleChange("email", e.target.value)}
                placeholder="contact@organisation.fr"
                className="w-full rounded-lg border border-stone-300 bg-stone-50 py-2.5 pl-9 pr-3 text-sm placeholder:text-stone-400 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-stone-800">
                Mot de passe
              </label>
              <div className="relative mt-1.5">
                <Lock
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400"
                />
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => handleChange("password", e.target.value)}
                  className="w-full rounded-lg border border-stone-300 bg-stone-50 py-2.5 pl-9 pr-3 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-800">
                Confirmer mot de passe
              </label>
              <div className="relative mt-1.5">
                <Lock
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400"
                />
                <input
                  type="password"
                  value={form.confirmPassword}
                  onChange={(e) =>
                    handleChange("confirmPassword", e.target.value)
                  }
                  className="w-full rounded-lg border border-stone-300 bg-stone-50 py-2.5 pl-9 pr-3 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                />
              </div>
            </div>
          </div>

          <label className="flex items-start gap-2 text-xs text-stone-500">
            <input
              type="checkbox"
              checked={form.acceptedTerms}
              onChange={(e) => handleChange("acceptedTerms", e.target.checked)}
              className="mt-0.5"
            />
            <span>
              J'accepte les{" "}
              <span className="font-medium text-[#f6682f]">
                Conditions Générales
              </span>{" "}
              et la{" "}
              <span className="font-medium text-[#f6682f]">
                Politique de Confidentialité
              </span>
              .
            </span>
          </label>

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-[#f6682f]">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-[#f6682f] py-2.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60"
          >
            {submitting ? "Création..." : "Créer mon compte organisateur →"}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-stone-500">
          Vous êtes déjà inscrit ?{" "}
          <Link to="/login" className="font-medium text-[#f6682f]">
            Se connecter
          </Link>
        </p>
        <Link
          to="/register-participant"
          className="mt-2 block rounded-lg bg-stone-100 py-2 text-center text-sm font-medium text-stone-700 hover:bg-stone-200"
        >
          Vous êtes un participant ? Inscrivez-vous ici
        </Link>
      </div>
    </div>
  );
}
