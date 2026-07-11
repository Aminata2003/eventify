import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/Navbar";

function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const user = await login(formData.email, formData.password);
      const from = location.state?.from;
      if (from) {
        navigate(from, { replace: true });
      } else if (user?.role === "organizer") {
        navigate("/dashboard", { replace: true });
      } else {
        navigate("/events", { replace: true });
      }
    } catch (err) {
      const data = err?.response?.data;
      if (data?.detail) {
        setError(data.detail);
      } else {
        setError("Email ou mot de passe invalide.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center py-12">
      <Navbar />

      <div className="w-full max-w-md bg-white rounded-xl border border-gray-100 shadow-sm mt-8 p-8">
        <h1 className="text-2xl font-semibold text-center">
          Se connecter
        </h1>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="text-sm text-gray-600 mb-1 block">
              Email
            </label>

            <input
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
              required
            />
          </div>

          <div>
            <label className="text-sm text-gray-600 mb-1 block">
              Mot de passe
            </label>

            <input
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
              required
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-primary text-white py-3 rounded-md font-medium hover:bg-orange-600 transition disabled:opacity-60"
          >
            {submitting ? "Connexion..." : "Connexion"}
          </button>
          {error && (
            <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}
        </form>

        <div className="mt-6 text-center text-sm text-gray-600">
          <div>
            Pas de compte ?{" "}
            <Link to="/register" className="text-primary">
              S'inscrire
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;