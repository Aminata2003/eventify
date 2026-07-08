import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Calendar, MapPin, CheckCircle2 } from "lucide-react";
import Navbar from "../components/Navbar";
import { mockEvents } from "../data/mockEvents";

function EventRegister() {
  const { id } = useParams();
  const navigate = useNavigate();
  const event = mockEvents.find((e) => e.id === Number(id));

  const isPaid = event.price.toLowerCase() !== "gratuit";
  const [formData, setFormData] = useState({ name: "", email: "", paymentMethod: isPaid ? "Carte bancaire" : "" });
  const [isConfirmed, setIsConfirmed] = useState(false);

  if (!event) {
    return (
      <div className="min-h-screen bg-orange-50/30">
        <Navbar />
        <p className="text-center text-gray-500 mt-16">Événement introuvable.</p>
      </div>
    );
  }

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Branchement API à venir (eventService.registerToEvent)
    console.log("Inscription à l'événement", event.id, formData);
    setIsConfirmed(true);
  };

  if (isConfirmed) {
    return (
      <div className="min-h-screen bg-orange-50/30 flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 max-w-md w-full text-center">
            <CheckCircle2 size={56} className="text-green-500 mx-auto" strokeWidth={1.3} />
            <h1 className="text-xl font-bold text-gray-900 mt-4">Inscription confirmée !</h1>
            <p className="text-gray-500 mt-2">
              Vous êtes inscrit(e) à <span className="font-medium text-gray-800">{event.title}</span>.
              Un e-mail de confirmation vous a été envoyé.
            </p>
            <div className="flex flex-col gap-3 mt-6">
              <button
                onClick={() => navigate("/my-events")}
                className="bg-primary text-white text-sm font-medium py-2.5 rounded-lg hover:bg-orange-700 transition"
              >
                Voir mes événements
              </button>
              <button
                onClick={() => navigate("/")}
                className="border border-gray-200 text-gray-700 text-sm font-medium py-2.5 rounded-lg hover:border-primary transition"
              >
                Retour à l'accueil
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-orange-50/30 flex flex-col">
      <Navbar />

      <div className="flex-1 max-w-4xl mx-auto w-full px-8 py-10 grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Récap événement */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden h-fit">
          <img src={event.image} alt={event.title} className="w-full h-44 object-cover" />
          <div className="p-5">
            <span className="text-xs font-medium text-primary">{event.category}</span>
            <h2 className="font-bold text-gray-900 mt-1 leading-snug">{event.title}</h2>

            <div className="flex items-center gap-1 text-sm text-gray-500 mt-3">
              <Calendar size={14} />
              {event.dateLabel} · {event.time}
            </div>
            <div className="flex items-center gap-1 text-sm text-gray-500 mt-1.5">
              <MapPin size={14} />
              {event.venue}
            </div>

            <div className="flex items-center justify-between mt-5 pt-4 border-t border-gray-100">
              <span className="text-sm text-gray-500">Prix</span>
              <span className="font-semibold text-gray-900">{event.price}</span>
            </div>
            {isPaid && (
              <div className="mt-3 text-sm text-gray-500">
                Paiement sécurisé via carte bancaire ou mobile money.
              </div>
            )}
          </div>
        </div>

        {/* Formulaire d'inscription */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h1 className="text-xl font-bold text-gray-900">S'inscrire à l'événement</h1>
          <p className="text-sm text-gray-500 mt-1">
            Renseignez vos informations pour confirmer votre place.
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label htmlFor="name" className="text-sm font-medium text-gray-800">
                Nom complet
              </label>
              <input
                id="name"
                name="name"
                type="text"
                placeholder="Aminata Diop"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full mt-1.5 border border-gray-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-primary transition"
              />
            </div>

            <div>
              <label htmlFor="email" className="text-sm font-medium text-gray-800">
                Adresse e-mail
              </label>
              <input
                id="email"
                name="email"
                type="email"
                placeholder="nom@exemple.com"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full mt-1.5 border border-gray-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-primary transition"
              />
            </div>

            {isPaid && (
              <div>
                <label htmlFor="paymentMethod" className="text-sm font-medium text-gray-800">
                  Mode de paiement
                </label>
                <select
                  id="paymentMethod"
                  name="paymentMethod"
                  value={formData.paymentMethod}
                  onChange={handleChange}
                  required
                  className="w-full mt-1.5 border border-gray-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-primary transition"
                >
                  <option>Carte bancaire</option>
                  <option>Mobile money</option>
                  <option>Virement bancaire</option>
                </select>
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-primary text-white font-medium py-2.5 rounded-lg hover:bg-orange-700 transition mt-2"
            >
              Confirmer mon inscription
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default EventRegister;