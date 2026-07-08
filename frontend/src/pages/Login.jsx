import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/Navbar";

function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({ email: "", password: "" });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    login(formData.email);
    navigate("/my-events");
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center py-12">
      <Navbar />

      <div className="w-full max-w-md bg-white rounded-xl border border-gray-100 shadow-sm mt-8 p-8">
        <h1 className="text-2xl font-semibold text-center">Se connecter</h1>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="text-sm text-gray-600 mb-1 block">Email</label>
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
            <label className="text-sm text-gray-600 mb-1 block">Mot de passe</label>
            <input
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
              required
            />
          </div>

          <button type="submit" className="w-full bg-primary text-white py-3 rounded-md font-medium hover:bg-orange-600 transition">Connexion</button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-600">
          <div>Pas de compte ? <Link to="/register" className="text-primary">S'inscrire</Link></div>
        </div>
      </div>
    </div>
  );
}

export default Login;
