import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function OrganizerRoute({ children }) {

  const { user, initializing } = useAuth();

  if (initializing) {
    return <div className="p-6 text-center text-sm text-stone-500">Chargement de votre session...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== "organizer") {
    return <Navigate to="/" replace />;
  }

  return children;
}
