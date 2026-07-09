import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./App.css";

// Pages créées par [ton nom]
import CreateEvent from "./pages/CreateEvent";
import EventDetails from "./pages/EventDetails";
import Dashboard from "./pages/Dashboard";
import SuiviEvent from "./pages/SuiviEvent";
import RegisterOrganisateur from "./pages/RegisterOrganisateur";

// Pages créées par ton binôme
import Home from "./pages/Home";
import Login from "./pages/Login";
import MyEvents from "./pages/MyEvents";
import RegisterParticipant from "./pages/RegisterParticipant";

function App() {  return (
    <BrowserRouter>
      <Routes>
        {/* Page d'accueil - catalogue des événements publics */}
        <Route path="/" element={<Home />} />

        {/* Authentification */}
        <Route path="/login" element={<Login />} />
        <Route path="/register-organisateur" element={<RegisterOrganisateur />} />
        <Route path="/register-participant" element={<RegisterParticipant />} />

        {/* Événements */}
        <Route path="/event/:id" element={<EventDetails />} />
        <Route path="/create-event" element={<CreateEvent />} />

        {/* Organisateur */}
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/suivi-events" element={<SuiviEvent />} />

        {/* Participant */}
        <Route path="/my-events" element={<MyEvents />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
