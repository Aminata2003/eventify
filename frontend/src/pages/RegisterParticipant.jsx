import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { User, Mail, Lock } from "lucide-react";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";

const getServerError = (error) => {
  const data = error?.response?.data;
  if (!data) return "Une erreur est survenue, réessaie dans un instant.";
  if (typeof data === "string") return data;
  if (data.detail) return data.detail;
  if (data.error) return data.error;
  const firstField = ["email", "name", "password", "role"].find((key) => data[key]);
  if (firstField) {
    const value = data[firstField];
    return Array.isArray(value) ? value[0] : value;
  }
  return JSON.stringify(data);
};

function RegisterParticipant() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    acceptedTerms: false,
  });
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!formData.fullName.trim() || !formData.email.trim() || !formData.password) {
      setError("Merci de remplir tous les champs.");
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }
    if (!formData.acceptedTerms) {
      setError("Merci d'accepter les Conditions Générales pour continuer.");
      return;
    }

    setSubmitting(true);
    try {
      await register({
        name: formData.fullName,
        email: formData.email,
        password: formData.password,
        role: "participant",
      });
      navigate("/events", { replace: true });
    } catch (err) {
      setError(getServerError(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center py-12">
      <Navbar />

      <div className="w-full max-w-md bg-white rounded-xl border border-gray-100 shadow-sm mt-8 p-8">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-semibold">Bienvenue sur Eventify</h1>
          <p className="text-sm text-gray-600 mt-2">Découvrez et rejoignez les meilleurs événements près de chez vous.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm text-gray-600 mb-1 block">Nom complet</label>
            <div className="flex items-center bg-gray-50 border border-gray-200 rounded-md px-3 py-2">
              <User size={16} className="text-gray-400 mr-2" />
              <input
                name="fullName"
                value={formData.fullName}
                onChange={(e) => handleChange("fullName", e.target.value)}
                placeholder="Jean Dupont"
                className="bg-transparent outline-none w-full text-sm"
              />
            </div>
          </div>

          <div>
            <label className="text-sm text-gray-600 mb-1 block">Email</label>
            <div className="flex items-center bg-gray-50 border border-gray-200 rounded-md px-3 py-2">
              <Mail size={16} className="text-gray-400 mr-2" />
              <input
                name="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleChange("email", e.target.value)}
                placeholder="jean.dupont@exemple.fr"
                className="bg-transparent outline-none w-full text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-gray-600 mb-1 block">Mot de passe</label>
              <div className="flex items-center bg-gray-50 border border-gray-200 rounded-md px-3 py-2">
                <Lock size={16} className="text-gray-400 mr-2" />
                <input
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => handleChange("password", e.target.value)}
                  placeholder="••••••••"
                  className="bg-transparent outline-none w-full text-sm"
                />
              </div>
            </div>

            <div>
              <label className="text-sm text-gray-600 mb-1 block">Confirmer le mot de passe</label>
              <div className="flex items-center bg-gray-50 border border-gray-200 rounded-md px-3 py-2">
                <Lock size={16} className="text-gray-400 mr-2" />
                <input
                  name="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => handleChange("confirmPassword", e.target.value)}
                  placeholder="••••••••"
                  className="bg-transparent outline-none w-full text-sm"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <input
              id="tos"
              type="checkbox"
              checked={formData.acceptedTerms}
              onChange={(e) => handleChange("acceptedTerms", e.target.checked)}
              className="w-4 h-4"
            />
            <label htmlFor="tos" className="text-gray-600">
              J'accepte les <a href="#" className="text-primary">Conditions Générales</a> et la <a href="#" className="text-primary">Politique de Confidentialité</a>.
            </label>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-primary text-white py-3 rounded-md font-medium hover:bg-orange-600 transition disabled:opacity-60"
          >
            {submitting ? "Création..." : "Créer mon compte"}
          </button>
          {error && (
            <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}
        </form>

        <div className="mt-6 text-center text-sm text-gray-600">
          <div>
            Vous êtes déjà inscrit ? <Link to="/login" className="text-primary">Se connecter</Link>
          </div>
          <div className="mt-3">
            Vous êtes un organisateur ? Demandez à votre collègue ou contactez l'équipe pour l'inscription organisateur.
          </div>
        </div>
      </div>
    </div>
  );
}

export default RegisterParticipant;
