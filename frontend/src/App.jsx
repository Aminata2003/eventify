import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import RegisterParticipant from "./pages/RegisterParticipant";
import Events from "./pages/Events";
import RegisterOrganisateur from "./pages/RegisterOrganisateur";
import Login from "./pages/Login";
import MyEvents from "./pages/MyEvents";
import EventDetails from "./pages/EventDetails";
import EventRegister from "./pages/EventRegister";
import CreateEvent from "./pages/CreateEvent";
import Dashboard from "./pages/Dashboard";
import SuiviEvent from "./pages/SuiviEvent";
import Updates from "./pages/Updates";
import { AuthProvider } from "./context/AuthContext";

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/events" element={<Events />} />
          <Route path="/register" element={<RegisterParticipant />} />
          <Route path="/register-participant" element={<RegisterParticipant />} />
          <Route path="/register-organisateur" element={<RegisterOrganisateur />} />
          <Route path="/login" element={<Login />} />
          <Route path="/my-events" element={<MyEvents />} />
          <Route path="/event/:id" element={<EventDetails />} />
          <Route path="/event/:id/register" element={<EventRegister />} />
          <Route path="/create-event" element={<CreateEvent />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/dashboard/:eventId/participants" element={<SuiviEvent />} />
          <Route path="/updates" element={<Updates />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;