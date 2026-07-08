import { User, Mail, Lock } from "lucide-react";
import Navbar from "../components/Navbar";

function RegisterParticipant() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center py-12">
      <Navbar />

      <div className="w-full max-w-md bg-white rounded-xl border border-gray-100 shadow-sm mt-8 p-8">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-semibold">Bienvenue sur Eventify</h1>
          <p className="text-sm text-gray-600 mt-2">Découvrez et rejoignez les meilleurs événements près de chez vous.</p>
        </div>

        <form className="space-y-4">
          <div>
            <label className="text-sm text-gray-600 mb-1 block">Nom complet</label>
            <div className="flex items-center bg-gray-50 border border-gray-200 rounded-md px-3 py-2">
              <User size={16} className="text-gray-400 mr-2" />
              <input
                name="fullName"
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
                  placeholder="••••••••"
                  className="bg-transparent outline-none w-full text-sm"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <input id="tos" type="checkbox" className="w-4 h-4" />
            <label htmlFor="tos" className="text-gray-600">J'accepte les <a href="#" className="text-primary">Conditions Générales</a> et la <a href="#" className="text-primary">Politique de Confidentialité</a>.</label>
          </div>

          <button type="button" className="w-full bg-primary text-white py-3 rounded-md font-medium hover:bg-orange-600 transition">Créer mon compte</button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-600">
          <div>Vous êtes déjà inscrit ? <a href="/login" className="text-primary">Se connecter</a></div>
          <div className="mt-3">Vous êtes un organisateur ? Demandez à votre collègue ou contactez l'équipe pour l'inscription organisateur.</div>
        </div>
      </div>
    </div>
  );
}

export default RegisterParticipant;
