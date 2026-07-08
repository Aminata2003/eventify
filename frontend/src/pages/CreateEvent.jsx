import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ImagePlus, MapPin, Map } from "lucide-react";
import NavbarOrganizer from "../components/NavbarOrganizer";
import Footer from "../components/Footer";
import { createEvent } from "../services/eventService";

const CATEGORIES = [
  "Musique",
  "Conférence",
  "Gastronomie",
  "Networking",
  "Art",
  "Sport",
];

const USERS = [
  {
    id: 1,
    name: "Aminata Sow",
    email: "aminata@email.com",
  },
  {
    id: 2,
    name: "Fatou Ndiaye",
    email: "fatou@email.com",
  },
  {
    id: 3,
    name: "Moussa Diop",
    email: "moussa@email.com",
  },
  {
    id: 4,
    name: "Marième Fall",
    email: "marieme@email.com",
  },
];

export default function CreateEvent() {

  const navigate = useNavigate();

  const [form, setForm] = useState({
    title: "",
    description: "",
    date: "",
    time: "",
    category: "",
    location: "",
     places: "",
    is_public: true,
    allowed_users: [],
    imageFile: null,
  });


  const [imagePreview, setImagePreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);



  function handleChange(field, value) {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  }



  function handleImageChange(e) {

    const file = e.target.files?.[0];

    if (!file) return;

    handleChange("imageFile", file);

    setImagePreview(URL.createObjectURL(file));
  }




  async function handleSubmit(e) {

    e.preventDefault();

    setError(null);


    if (
      !form.title.trim() ||
      !form.date ||
      !form.places ||
      !form.location.trim()
    ) {

      setError(
        "Merci de remplir au minimum le titre, la date et le lieu."
      );

      return;
    }



    if (
      !form.is_public &&
      form.allowed_users.length === 0
    ) {

      setError(
        "Veuillez sélectionner au moins une personne pour un événement privé."
      );

      return;
    }



    setSubmitting(true);


    try {

      const payload = {

        title: form.title,

        description: form.description,

        date: form.date,

        time: form.time,

        category: form.category,
        places: Number(form.places),

        location: form.location,

        is_public: form.is_public,
        private_users: form.private_users,


        allowed_users: form.is_public
          ? []
          : form.allowed_users,


        image: imagePreview,

      };


      const created = await createEvent(payload);


      navigate(`/event/${created.id}`);


    } catch (err) {


      setError(
        "Une erreur est survenue, réessaie dans un instant."
      );


    } finally {

      setSubmitting(false);

    }

  }



  return (

    <div className="min-h-screen bg-stone-50">

      <NavbarOrganizer active="create-event" />


      <main className="mx-auto max-w-2xl px-6 py-10">

        <h1 className="text-3xl font-bold text-stone-900">
          Créer un nouvel événement
        </h1>


        <p className="mt-1 text-sm text-stone-500">
          Remplissez les détails ci-dessous pour diffuser votre événement à la
          communauté Eventify.
        </p>


        <form
          onSubmit={handleSubmit}
          className="mt-8 space-y-8"
        >


          {/* Titre */}

          <div>

            <label className="block text-sm font-medium text-stone-800">
              Titre de l'événement
            </label>


            <input

              type="text"

              maxLength={100}

              value={form.title}

              onChange={(e) =>
                handleChange("title", e.target.value)
              }

              placeholder="ex: Festival de Musique d'Été 2024"

              className="mt-2 w-full rounded-lg border border-stone-300 px-4 py-2.5 text-sm placeholder:text-stone-400 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"

            />


           
          <p className="mt-1 text-xs text-stone-400">
  Choisissez un titre accrocheur et descriptif. Max 100
  caractères.
</p>
</div>

{/* Description */}
<div>
  <label className="block text-sm font-medium text-stone-800">
    Description
  </label>

  <textarea
    rows={5}
    value={form.description}
    onChange={(e) => handleChange("description", e.target.value)}
    placeholder="Parlez-nous de l'ambiance, des artistes et de ce que les participants peuvent attendre..."
    className="mt-2 w-full resize-none rounded-lg border border-stone-300 px-4 py-2.5 text-sm placeholder:text-stone-400 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
  />

  <p className="mt-1 text-xs text-stone-400">
    Le formatage Markdown est supporté pour la description.
  </p>
</div>


{/* Image */}
<div>
  <label className="block text-sm font-medium text-stone-800">
    Image de couverture de l'événement
  </label>

  <label
    htmlFor="event-image"
    className="mt-2 flex h-56 cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-stone-300 bg-white text-center hover:border-red-400"
  >

    {imagePreview ? (
      <img
        src={imagePreview}
        alt="Aperçu"
        className="h-full w-full rounded-xl object-cover"
      />
    ) : (
      <>
        <ImagePlus className="text-stone-400" size={28} />

        <p className="text-sm text-stone-500">
          Cliquez pour télécharger ou glissez-déposez
        </p>

        <p className="text-xs text-stone-400">
          Ratio requis en 1600x1000 recommandé
        </p>
      </>
    )}

    <input
      id="event-image"
      type="file"
      accept="image/*"
      onChange={handleImageChange}
      className="hidden"
    />

  </label>
</div>


{/* Date + Catégorie */}
<div className="grid grid-cols-1 gap-6 md:grid-cols-3">

  <div>
    <label className="block text-sm font-medium text-stone-800">
      Date et Heure
    </label>

    <input
      type="datetime-local"
      value={form.date}
      onChange={(e) => handleChange("date", e.target.value)}
      className="mt-2 w-full rounded-lg border border-stone-300 px-4 py-2.5 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
    />
  </div>


  <div>
    <label className="block text-sm font-medium text-stone-800">
      Catégorie
    </label>

    <select
      value={form.category}
      onChange={(e) => handleChange("category", e.target.value)}
      className="mt-2 w-full rounded-lg border border-stone-300 px-4 py-2.5 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
    >

      <option value="">
        Sélectionnez une catégorie
      </option>

      {CATEGORIES.map((cat) => (
        <option key={cat} value={cat}>
          {cat}
        </option>
      ))}

    </select>
  </div>
  <div>
  <label className="block text-sm font-medium text-stone-800">
    Nombre de places
  </label>

  <input
    type="number"
    min="1"
    value={form.places}
    onChange={(e) =>
      handleChange("places", e.target.value)
    }
    placeholder="Ex: 100"
    className="mt-2 w-full rounded-lg border border-stone-300 px-4 py-2.5 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
  />

  <p className="mt-1 text-xs text-stone-400">
    Indiquez la capacité maximale de l'événement.
  </p>
</div>

</div>
{/* Lieu */}
<div>

  <label className="block text-sm font-medium text-stone-800">
    Lieu de l'événement
  </label>


  <div className="relative mt-2">

    <MapPin
      size={16}
      className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400"
    />


    <input
      type="text"
      value={form.location}
      onChange={(e) => handleChange("location", e.target.value)}
      placeholder="Rechercher une salle ou une ville"
      className="w-full rounded-lg border border-stone-300 py-2.5 pl-9 pr-4 text-sm placeholder:text-stone-400 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
    />

  </div>



  {/* Carte localisation */}
  <div className="mt-4 overflow-hidden rounded-xl border border-stone-200 bg-white">

    <div className="flex h-48 items-center justify-center bg-stone-100">

      <div className="text-center text-stone-400">

        <Map size={35} className="mx-auto mb-2"/>


        {form.location ? (

          <>
            <p className="text-sm font-medium text-stone-700">
              {form.location}
            </p>

            <p className="mt-1 text-xs">
              Aperçu de la localisation
            </p>
          </>


        ) : (

          <p className="text-sm">
            La carte apparaîtra après la sélection du lieu
          </p>

        )}

      </div>

    </div>

  </div>


</div>



{/* Statut de l'événement */}
<div className="rounded-xl border border-stone-200 bg-white px-5 py-5">


  <div className="flex items-center justify-between">

    <div>

      <p className="text-sm font-medium text-stone-800">
        Statut de l'événement
      </p>


      <p className="text-xs text-stone-400">
        Choisissez si votre événement est accessible à tous ou seulement à certaines personnes.
      </p>

    </div>



    <button
      type="button"
      role="switch"
      aria-checked={form.is_public}

      onClick={() =>
        handleChange("is_public", !form.is_public)
      }


      className={`relative h-6 w-11 rounded-full transition-colors ${
        form.is_public
          ? "bg-[#f6682f]"
          : "bg-stone-300"
      }`}
    >

      <span

        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
          form.is_public
            ? "translate-x-5"
            : "translate-x-0.5"
        }`}

      />

    </button>


  </div>



  <div className="mt-3 text-sm font-medium">

    {form.is_public ? (

      <span className="text-green-600">
        🌍 Événement public
      </span>


    ) : (

      <span className="text-orange-600">
        🔒 Événement privé
      </span>

    )}

  </div>


</div>




{/* Invitations privées */}
{!form.is_public && (

<div className="rounded-xl border border-orange-200 bg-orange-50 px-5 py-5">


  <label className="block text-sm font-medium text-stone-800">

    Inviter des participants

  </label>


  <p className="mt-1 text-xs text-stone-500">

    Ajoutez les personnes autorisées à voir et participer à cet événement privé.

  </p>



  <input

    type="text"

    placeholder="Entrer les emails séparés par des virgules"

    value={form.private_users || ""}

    onChange={(e) =>
      handleChange(
        "private_users",
        e.target.value
      )
    }


    className="mt-3 w-full rounded-lg border border-stone-300 px-4 py-2.5 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"

  />



  <p className="mt-2 text-xs text-stone-400">

    Exemple : utilisateur1@gmail.com, utilisateur2@gmail.com

  </p>


</div>

)}
{/* Message erreur */}
{error && (

  <p className="rounded-lg bg-[#f6682f] px-4 py-2 text-sm text-red-600">

    {error}

  </p>

)}



{/* Boutons */}
<div className="flex justify-end gap-3 border-t border-stone-200 pt-6">


  <button

    type="button"

    onClick={() => navigate(-1)}

    className="rounded-lg border border-stone-300 px-5 py-2.5 text-sm font-medium text-stone-700 hover:bg-stone-100"

  >

    Annuler

  </button>



  <button

    type="submit"

    disabled={submitting}

    className="rounded-lg bg-[#f6682f] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#ea580c] disabled:opacity-60"

  >

    {submitting
      ? "Enregistrement..."
      : "Enregistrer l'événement"}

  </button>


</div>


</form>


</main>


<Footer />


</div>

);

}