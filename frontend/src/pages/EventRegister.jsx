import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Calendar, MapPin, CheckCircle2 } from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { getEventById, registerToEvent, initiatePayment, confirmPayment } from "../services/eventService";
import waveLogo from "../assets/wave.svg";
import orangeLogo from "../assets/orange-money.svg";
import { useAuth } from "../context/AuthContext";
import { formatDateLabel } from "../utils/eventHelpers";

const formatServerError = (err, fallback) => {
  const data = err?.response?.data;
  if (!data) return err?.response?.data?.detail || err?.message || fallback;
  if (typeof data === "string") return data;
  if (typeof data === "object") {
    if (data.detail) return data.detail;
    return Object.entries(data)
      .map(([k, v]) => (Array.isArray(v) ? `${k}: ${v.join(" ")}` : `${k}: ${v}`))
      .join(" | ");
  }
  return String(data);
};

function EventRegister() {
  const rawId = useParams().id;
  const id = rawId && rawId !== "undefined" ? (isNaN(Number(rawId)) ? rawId : Number(rawId)) : null;
  const navigate = useNavigate();
  const { user } = useAuth();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [paymentError, setPaymentError] = useState(null);
  const [paymentSession, setPaymentSession] = useState(null);
  const [isConfirmingPayment, setIsConfirmingPayment] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    provider: "card",
    paymentMethod: "Carte bancaire",
    phone: "",
  });

  // Bug H corrigé : rediriger vers login si non connecté
  useEffect(() => {
    if (!user) navigate("/login", { replace: true, state: { from: `/event/${id}/register` } });
  }, [user, navigate, id]);

  useEffect(() => {
    let active = true;
    getEventById(id)
      .then((data) => {
        if (!active) return;
        setEvent(data);
      })
      .catch(() => {
        if (!active) return;
        setError("Impossible de charger cet événement.");
      })
      .finally(() => {
        if (!active) return;
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [id]);

  // Bug C corrigé : vérification fiable du prix (Number() gère '0', '0.00', null)
  const isPaid = event?.price != null && Number(event.price) > 0;

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "provider") {
      if (value === "card") {
        setFormData((prev) => ({ ...prev, provider: value, paymentMethod: "Carte bancaire" }));
      } else {
        setFormData((prev) => ({
          ...prev,
          provider: value,
          paymentMethod: prev.paymentMethod && prev.paymentMethod !== "Carte bancaire" ? prev.paymentMethod : "Wave",
        }));
      }
      return;
    }

    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError(null);
    setPaymentError(null);
    if (!event) return;

    if (isPaid) {
      try {
        const session = await initiatePayment(event.id, {
          provider: formData.provider,
          paymentMethod: formData.paymentMethod,
          phone: formData.phone,
          name: formData.name,
          email: formData.email,
          amount: event.price,
        });
        setPaymentSession(session);
      } catch (err) {
        setPaymentError(formatServerError(err, "Impossible de démarrer le paiement."));
      }
      return;
    }

    try {
      await registerToEvent(event.id, {
        name: formData.name,
        email: formData.email,
        paymentMethod: "",
      });
      setIsConfirmed(true);
    } catch (err) {
      setSubmitError(
        err.response?.data?.detail || "Impossible de vous inscrire pour le moment."
      );
    }
  };

  const handleConfirmPayment = async () => {
    if (!paymentSession?.sessionId) {
      setPaymentError("Session de paiement invalide, veuillez relancer le paiement.");
      return;
    }
    setIsConfirmingPayment(true);
    setPaymentError(null);
    try {
      await confirmPayment(paymentSession.sessionId, "demo-confirmation");
      setIsConfirmed(true);
    } catch (err) {
      setPaymentError(formatServerError(err, "Impossible de confirmer le paiement."));
    } finally {
      setIsConfirmingPayment(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-orange-50/30">
        <Navbar />
        <p className="mx-auto max-w-4xl px-6 py-16 text-center text-stone-500">Chargement de l'événement...</p>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen bg-orange-50/30">
        <Navbar />
        <p className="mx-auto max-w-4xl px-6 py-16 text-center text-[#ea580c]">{error || "Événement introuvable."}</p>
      </div>
    );
  }

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
              {formatDateLabel(event.date)} · {event.time}
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
              <>
                <div>
                  <label htmlFor="provider" className="text-sm font-medium text-gray-800">
                    Mode de paiement
                  </label>
                  <select
                    id="provider"
                    name="provider"
                    value={formData.provider}
                    onChange={handleChange}
                    required
                    className="w-full mt-1.5 border border-gray-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-primary transition"
                  >
                    <option value="card">Carte bancaire</option>
                    <option value="mobile_money">Mobile money (Wave / Orange Money)</option>
                  </select>
                  {formData.provider === "mobile_money" && (
                    <div className="mt-3 flex items-center gap-3">
                      <div
                        role="button"
                        tabIndex={0}
                        aria-pressed={formData.paymentMethod === "Wave"}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            setFormData((prev) => ({ ...prev, provider: "mobile_money", paymentMethod: "Wave" }));
                            e.preventDefault();
                          }
                        }}
                        onClick={() =>
                          setFormData((prev) => ({ ...prev, provider: "mobile_money", paymentMethod: "Wave" }))
                        }
                        className={`flex items-center gap-2 p-1 rounded-md cursor-pointer ${
                          formData.paymentMethod === "Wave" ? "ring-2 ring-primary" : "hover:opacity-90"
                        }`}
                      >
                        <img src={waveLogo} alt="Wave" className="w-12 h-8 object-contain" />
                      </div>

                      <div
                        role="button"
                        tabIndex={0}
                        aria-pressed={formData.paymentMethod === "Orange Money"}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            setFormData((prev) => ({ ...prev, provider: "mobile_money", paymentMethod: "Orange Money" }));
                            e.preventDefault();
                          }
                        }}
                        onClick={() =>
                          setFormData((prev) => ({ ...prev, provider: "mobile_money", paymentMethod: "Orange Money" }))
                        }
                        className={`flex items-center gap-2 p-1 rounded-md cursor-pointer ${
                          formData.paymentMethod === "Orange Money" ? "ring-2 ring-primary" : "hover:opacity-90"
                        }`}
                      >
                        <img src={orangeLogo} alt="Orange Money" className="w-12 h-8 object-contain" />
                      </div>
                    </div>
                  )}
                </div>
                {formData.provider === "mobile_money" && (
                  <div>
                    <label htmlFor="phone" className="text-sm font-medium text-gray-800">
                      Numéro mobile
                    </label>
                    <input
                      id="phone"
                      name="phone"
                      type="tel"
                      placeholder="77 123 45 67"
                      value={formData.phone}
                      onChange={handleChange}
                      required
                      className="w-full mt-1.5 border border-gray-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-primary transition"
                    />
                  </div>
                )}
              </>
            )}

            <button
              type="submit"
              className="w-full bg-primary text-white font-medium py-2.5 rounded-lg hover:bg-orange-700 transition mt-2"
            >
              {isPaid ? "Démarrer le paiement" : "Confirmer mon inscription"}
            </button>
            {paymentError && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {paymentError}
              </div>
            )}
          </form>

          {paymentSession && (
            <div className="mt-6 rounded-xl border border-primary/20 bg-primary/5 p-5">
              <h2 className="text-base font-semibold text-primary">Instructions de paiement</h2>
              <p className="mt-3 text-sm text-gray-600">{paymentSession.instructions}</p>
              <div className="mt-4 space-y-2 text-sm text-gray-700">
                <p>
                  Référence de paiement : <span className="font-medium">{paymentSession.paymentReference}</span>
                </p>
                <p>
                  Montant : <span className="font-medium">{paymentSession.amount} {paymentSession.currency}</span>
                </p>
              </div>
              <button
                onClick={handleConfirmPayment}
                disabled={isConfirmingPayment}
                className="mt-4 w-full bg-primary text-white font-medium py-2.5 rounded-lg hover:bg-orange-700 transition"
              >
                {isConfirmingPayment ? "Confirmation en cours..." : "J'ai payé / Simuler paiement"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default EventRegister;