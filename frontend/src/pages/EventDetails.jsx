import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Calendar, Clock, MapPin, Users, Star, Share2, Copy } from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { useAuth } from "../context/AuthContext";
import { getEventById, getEvents, getEventReviews, postEventReview } from "../services/eventService";

export default function EventDetails() {
  const rawId = useParams().id;
  const id = rawId && rawId !== "undefined" ? (isNaN(Number(rawId)) ? rawId : Number(rawId)) : null;
  const navigate = useNavigate();

  const { user, initializing } = useAuth();
  const [event, setEvent] = useState(null);
  const [relatedEvents, setRelatedEvents] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [reviewLoading, setReviewLoading] = useState(true);
  const [reviewError, setReviewError] = useState(null);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: "" });
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [copyMessage, setCopyMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setReviewLoading(true);
    setReviewError(null);

    Promise.all([getEventById(id), getEvents(), getEventReviews(id)])
      .then(([eventData, allEvents, reviewsData]) => {
        if (cancelled) return;

        setEvent(eventData);
        setRelatedEvents(
          allEvents.filter((e) => String(e.id) !== String(id)).slice(0, 3)
        );
        setReviews(Array.isArray(reviewsData) ? reviewsData : []);
      })
      .catch(() => !cancelled && setError("Impossible de charger cet événement."))
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
        setReviewLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [id]);


  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50">
        <Navbar />
        <p className="mx-auto max-w-4xl px-6 py-16 text-center text-stone-500">
          Chargement de l'événement...
        </p>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen bg-stone-50">
        <Navbar />
        <p className="mx-auto max-w-4xl px-6 py-16 text-center text-[#ea580c]">
          {error || "Événement introuvable."}
        </p>
      </div>
    );
  }

  // Bug A corrigé : confirmed_count pour les places réelles occupées (exclut waitlist/pending)
  const spotsLeft = (event.places ?? event.capacity) - (event.confirmed_count ?? 0);
  const eventPassed = event.date ? new Date(`${event.date}T23:59:59`) < new Date() : false;
  const isCancelled = event.status === "cancelled";
  const registrationBlocked = eventPassed || isCancelled;
  const averageRating = reviews.length
    ? reviews.reduce((sum, review) => sum + Number(review.rating), 0) / reviews.length
    : 0;

  const shareUrl = typeof window !== "undefined" ? window.location.href : `${window.location.origin}/event/${event.id}`;
  const whatsappText = encodeURIComponent(`Découvrez cet événement : ${event.title} - ${shareUrl}`);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopyMessage("Lien copié !");
      setTimeout(() => setCopyMessage(""), 2000);
    } catch (err) {
      setCopyMessage("Impossible de copier le lien.");
      setTimeout(() => setCopyMessage(""), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50">
      <Navbar active="discover" />

      {/* Hero */}
      <div className="relative h-72 w-full overflow-hidden sm:h-96">
        <img
          src={event.image}
          alt={event.title}
          className="h-full w-full object-cover"
        />

        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

          <div className="absolute bottom-6 left-0 w-full px-6">
            <div className="mx-auto max-w-4xl">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-medium text-stone-800">
                  {event.category}
                </span>
                {/* Bug G : badge statut visible */}
                {isCancelled && (
                  <span className="rounded-full bg-red-500 px-3 py-1 text-xs font-bold text-white uppercase tracking-wide">
                    ❌ Annulé
                  </span>
                )}
                {!isCancelled && spotsLeft <= 0 && (
                  <span className="rounded-full bg-stone-800/80 px-3 py-1 text-xs font-bold text-white uppercase tracking-wide">
                    Complet
                  </span>
                )}
                {event.status === "draft" && (
                  <span className="rounded-full bg-yellow-400 px-3 py-1 text-xs font-bold text-stone-800 uppercase tracking-wide">
                    Brouillon
                  </span>
                )}
              </div>

              <h1 className="mt-3 max-w-2xl text-2xl font-bold text-white sm:text-3xl">
                {event.title}
              </h1>
            </div>
          </div>
      </div>


      <main className="mx-auto grid max-w-4xl grid-cols-1 gap-8 px-6 py-8 lg:grid-cols-3">

        {/* Colonne principale */}
        <div className="lg:col-span-2">

          <div className="flex flex-wrap gap-6 border-b border-stone-200 pb-6 text-sm text-stone-600">
            <span className="flex items-center gap-2">
              <Calendar size={16} /> {event.date}
            </span>

            <span className="flex items-center gap-2">
              <Clock size={16} /> {event.time}
            </span>

            <span className="flex items-center gap-2">
              <MapPin size={16} /> {event.location}
            </span>
          </div>


          <div className="flex flex-col gap-4 py-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs text-stone-400">
                Organisé par
              </p>

              <p className="text-sm font-medium text-stone-800">
                {event.organizer?.name || "Organisateur"}
              </p>
            </div>

            <button className="text-sm font-medium text-[#f6682f] hover:underline">
              Suivre
            </button>
          </div>

          <div className="mb-6 rounded-3xl border border-stone-200 bg-white p-5">
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleCopyLink}
                className="inline-flex items-center gap-2 rounded-full border border-stone-200 bg-stone-100 px-4 py-2 text-sm font-medium text-stone-800 hover:bg-stone-200"
              >
                <Copy size={16} /> Copier le lien
              </button>
              <a
                href={`https://wa.me/?text=${whatsappText}`}
                target="_blank"
                rel="noreferrer noopener"
                className="inline-flex items-center gap-2 rounded-full border border-stone-200 bg-[#25D366]/10 px-4 py-2 text-sm font-medium text-[#128C7E] hover:bg-[#25D366]/20"
              >
                <Share2 size={16} /> Partager sur WhatsApp
              </a>
            </div>
            {copyMessage && (
              <p className="mt-3 text-sm text-emerald-700">{copyMessage}</p>
            )}
          </div>

          <div className="mb-6 rounded-3xl border border-stone-200 bg-white p-5">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 text-sm font-semibold text-stone-900">
                <Star size={18} className="text-yellow-500" />
                {averageRating.toFixed(1)}
              </div>
              <span className="text-xs text-stone-500">({reviews.length} avis)</span>
            </div>
            <p className="mt-3 text-sm text-stone-600">
              Les participants peuvent noter l'événement après sa tenue.
            </p>
          </div>


          <div>
            <h2 className="text-lg font-semibold text-stone-900">
              À propos de cet événement
            </h2>

            <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-stone-600">
              {event.description}
            </p>
          </div>


          {event.highlights && (
            <div className="mt-6">
              <h3 className="text-sm font-semibold text-stone-900">
                À quoi s'attendre :
              </h3>

              <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm text-stone-600">
                {event.highlights.map((h) => (
                  <li key={h}>{h}</li>
                ))}
              </ul>
            </div>
          )}

        </div>


        {/* Colonne inscription */}
        <aside className="space-y-4">

          <div className="rounded-xl border border-stone-200 bg-white p-5">

            <p className="text-xs text-stone-400">
              Billets à partir de
            </p>

            <p className="text-2xl font-bold text-stone-900">
              {event.price > 0
                ? `${event.price.toLocaleString("fr-FR")} FCFA`
                : "Gratuit"}
            </p>


            <p className="mt-1 flex items-center gap-1.5 text-xs text-stone-400">
              <Users size={13} />
              {spotsLeft} places restantes
            </p>


            <button
              onClick={() => navigate(`/event/${event.id}/register`)}
              disabled={registrationBlocked || spotsLeft <= 0}
              className="mt-4 w-full rounded-lg bg-[#f6682f] py-2.5 text-sm font-medium text-white hover:bg-[#ea580c] disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {/* Bug B corrigé : label clair selon l'état */}
              {isCancelled
                ? "Événement annulé"
                : eventPassed
                ? "Événement terminé"
                : spotsLeft <= 0
                ? "Complet — Liste d'attente"
                : "S'inscrire"}
            </button>

          </div>


          <div className="rounded-xl bg-[#f6682f]/10 p-4 text-xs text-[#ea580c]">
            Politique de remboursement : les tarifs préférentiels ne sont pas
            remboursables. Contactez l'organisateur pour toute question.
          </div>

        </aside>

      </main>



      {(eventPassed || reviews.length > 0) && (
        <section className="mx-auto max-w-4xl px-6 pb-14">
          <div className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-stone-900">Avis et notes</h2>
                <p className="mt-1 text-sm text-stone-500">
                  Retrouvez les retours des participants et laissez votre propre avis.
                </p>
              </div>
              <div className="text-sm text-stone-500">
                {reviews.length} avis
              </div>
            </div>

            {reviewError && (
              <p className="mt-4 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600">
                {reviewError}
              </p>
            )}

            <div className="mt-6 space-y-6">
              {reviewLoading ? (
                <p className="text-sm text-stone-500">Chargement des avis...</p>
              ) : reviews.length === 0 ? (
                <p className="text-sm text-stone-500">Aucun avis pour le moment.</p>
              ) : (
                <div className="space-y-4">
                  {reviews.map((review) => (
                    <div key={review.id} className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-semibold text-stone-900">{review.participant_name}</p>
                        <div className="flex items-center gap-1 text-sm text-stone-700">
                          <Star size={14} className="text-yellow-500" />
                          {review.rating}/5
                        </div>
                      </div>
                      {review.comment && (
                        <p className="mt-2 text-sm leading-relaxed text-stone-600">{review.comment}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {eventPassed && (
              <div className="mt-8 rounded-3xl border border-stone-200 bg-white p-6">
                <h3 className="text-base font-semibold text-stone-900">Laisser un avis</h3>
                <p className="mt-2 text-sm text-stone-500">
                  Dites aux autres ce que vous avez pensé de cet événement.
                </p>
                {initializing ? null : user ? (
                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      setReviewError(null);
                      setReviewSubmitting(true);
                      try {
                        const newReview = await postEventReview(event.id, reviewForm);
                        setReviews((prev) => [newReview, ...prev]);
                        setReviewForm({ rating: 5, comment: "" });
                      } catch (err) {
                        const message = err.response?.data?.detail || err.response?.data?.event || err.response?.data?.participant || err.message || "Impossible d'envoyer l'avis.";
                        setReviewError(message);
                      } finally {
                        setReviewSubmitting(false);
                      }
                    }}
                    className="mt-4 space-y-4"
                  >
                    <div>
                      <label className="block text-sm font-medium text-stone-800">Note</label>
                      <select
                        value={reviewForm.rating}
                        onChange={(e) => setReviewForm((prev) => ({ ...prev, rating: Number(e.target.value) }))}
                        className="mt-2 w-full max-w-xs rounded-lg border border-stone-300 bg-white px-4 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                      >
                        {[5, 4, 3, 2, 1].map((value) => (
                          <option key={value} value={value}>
                            {value} étoile{value > 1 ? "s" : ""}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-stone-800">Commentaire</label>
                      <textarea
                        value={reviewForm.comment}
                        onChange={(e) => setReviewForm((prev) => ({ ...prev, comment: e.target.value }))}
                        rows={4}
                        placeholder="Votre retour sur l'événement..."
                        className="mt-2 w-full rounded-lg border border-stone-300 px-4 py-3 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={reviewSubmitting}
                      className="inline-flex items-center justify-center rounded-lg bg-[#f6682f] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#ea580c] disabled:opacity-60"
                    >
                      {reviewSubmitting ? "Envoi..." : "Publier mon avis"}
                    </button>
                  </form>
                ) : (
                  <p className="mt-4 text-sm text-stone-500">
                    Connectez-vous pour laisser votre avis.
                  </p>
                )}
              </div>
            )}
          </div>
        </section>
      )}

      {relatedEvents.length > 0 && (
        <section className="mx-auto max-w-4xl px-6 pb-14">

          <h2 className="mb-4 text-lg font-semibold text-stone-900">
            Autres événements susceptibles de vous plaire
          </h2>


          <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">

            {relatedEvents.map((e) => (
              <Link
                key={e.id}
                to={`/event/${e.id}`}
                className="group overflow-hidden rounded-xl border border-stone-200 bg-white"
              >

                <img
                  src={e.image}
                  alt={e.title}
                  className="h-32 w-full object-cover transition-transform group-hover:scale-105"
                />


                <div className="p-3">

                  <p className="text-xs text-stone-400">
                    {e.date} • {e.location}
                  </p>

                  <p className="mt-1 text-sm font-medium text-stone-900 line-clamp-1">
                    {e.title}
                  </p>

                </div>

              </Link>
            ))}

          </div>

        </section>
      )}


      {/* AJOUT Footer */}
      <Footer />

    </div>
  );
}
