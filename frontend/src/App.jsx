import {
  RouterProvider,
  createBrowserRouter,
  createRoutesFromElements,
  Route,
} from "react-router-dom";

import Home from "./pages/Home";
import RegisterParticipant from "./pages/RegisterParticipant";
import RegisterOrganisateur from "./pages/RegisterOrganisateur";
import Login from "./pages/Login";

import Events from "./pages/Events";
import EventDetails from "./pages/EventDetails";

import MyEvents from "./pages/MyEvents";
import EventRegister from "./pages/EventRegister";

import CreateEvent from "./pages/CreateEvent";
import Dashboard from "./pages/Dashboard";
import SuiviEvent from "./pages/SuiviEvent";

import Updates from "./pages/Updates";

import ProtectedRoute from "./components/ProtectedRoute";
import OrganizerRoute from "./components/OrganizerRoute";

import { AuthProvider } from "./context/AuthContext";
import { ToastProvider } from "./components/Toast";

const router = createBrowserRouter(
  createRoutesFromElements(
    <>
      <Route path="/" element={<Home />} />
      <Route path="/events" element={<Events />} />
      <Route path="/event/:id" element={<EventDetails />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<RegisterParticipant />} />
      <Route path="/register-participant" element={<RegisterParticipant />} />
      <Route path="/register-organisateur" element={<RegisterOrganisateur />} />
      <Route
        path="/my-events"
        element={
          <ProtectedRoute>
            <MyEvents />
          </ProtectedRoute>
        }
      />
      <Route
        path="/event/:id/register"
        element={
          <ProtectedRoute>
            <EventRegister />
          </ProtectedRoute>
        }
      />
      <Route path="/updates" element={<Updates />} />
      <Route
        path="/create-event"
        element={
          <OrganizerRoute>
            <CreateEvent />
          </OrganizerRoute>
        }
      />
      <Route
        path="/dashboard"
        element={
          <OrganizerRoute>
            <Dashboard />
          </OrganizerRoute>
        }
      />
      <Route
        path="/dashboard/:eventId/participants"
        element={
          <OrganizerRoute>
            <SuiviEvent />
          </OrganizerRoute>
        }
      />
    </>,
  ),
  {
    future: {
      v7_startTransition: true,
      v7_relativeSplatPath: true,
    },
  },
);

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <RouterProvider router={router} />
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;