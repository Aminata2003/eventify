// eventService.js
//
// >>> SEUL FICHIER À MODIFIER LE JOUR DE L'INTÉGRATION BACKEND <<<
//
// Toutes les pages appellent ces fonctions et ne connaissent jamais
// la source réelle des données (mock ou API Django).
//
// Les données mockées viennent de src/data/mockData.js, LA source unique
// du projet (celle avec le commentaire "source unique pour toute
// l'application"). Ne jamais dupliquer ces données ailleurs.

import {
  mockEvents,
  mockParticipants,
  mockDashboardStats,
} from "../data/mockData";
import { api } from "./api";

const delay = (ms = 400) => new Promise((res) => setTimeout(res, ms));

export async function getEvents() {
  // Prefer real API if configured
  if (import.meta.env.VITE_API_URL) {
    const res = await api.get("/events/");
    return res.data;
  }
  // fallback mock
  await delay();
  return mockEvents;
}

export async function getEventById(id) {
  if (import.meta.env.VITE_API_URL) {
    const res = await api.get(`/events/${id}/`);
    return res.data;
  }
  await delay();
  const event = mockEvents.find((e) => String(e.id) === String(id));
  if (!event) throw new Error("Événement introuvable");
  return event;
}

export async function createEvent(payload) {
  if (import.meta.env.VITE_API_URL) {
    // handle file uploads
    if (payload.image instanceof File) {
      const formData = new FormData();
      Object.entries(payload).forEach(([k, v]) => formData.append(k, v));
      const res = await api.post("/events/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return res.data;
    }
    const res = await api.post("/events/", payload);
    return res.data;
  }
  await delay(600);
  const newEvent = {
    id: mockEvents.length + 1,
    views_count: 0,
    registrations_count: 0,
    status: "draft",
    price_currency: "FCFA",
    organizer: { id: 10, name: "Vous", avatar: null },
    ...payload,
  };
  mockEvents.push(newEvent);
  return newEvent;
}

export async function updateEvent(id, payload) {
  if (import.meta.env.VITE_API_URL) {
    const res = await api.patch(`/events/${id}/`, payload);
    return res.data;
  }
  await delay();
  const idx = mockEvents.findIndex((e) => String(e.id) === String(id));
  if (idx !== -1) mockEvents[idx] = { ...mockEvents[idx], ...payload };
  return mockEvents[idx];
}

export async function deleteEvent(id) {
  if (import.meta.env.VITE_API_URL) {
    await api.delete(`/events/${id}/`);
    return true;
  }
  await delay();
  const idx = mockEvents.findIndex((e) => String(e.id) === String(id));
  if (idx !== -1) mockEvents.splice(idx, 1);
  return true;
}

export async function getParticipants(eventId) {
  // Prefer real API
  //
  // ⚠️ IMPORTANT : data/mockData.js ne contient QU'UNE seule liste globale
  // de participants (mockParticipants), pas encore de lien explicite
  // "quel participant est inscrit à quel événement". `eventId` n'est donc
  // pas encore utilisé pour filtrer : tous les événements affichent
  // temporairement les 5 mêmes participants de démonstration.
  //
  // Pour que chaque événement ait SES propres participants, il faudrait
  // dans data/mockData.js une structure du type :
  //   export const mockRegistrations = [
  //     { id: 1, eventId: 1, name: "Aminata Diop", email: "...", ... },
  //     { id: 2, eventId: 2, name: "Moussa Fall", email: "...", ... },
  //   ];
  // et ici on ferait :
  //   return mockRegistrations.filter((r) => String(r.eventId) === String(eventId));
  if (import.meta.env.VITE_API_URL) {
    const res = await api.get(`/events/${eventId}/participants/`);
    return res.data;
  }
  await delay();
  return mockParticipants;
}

export async function registerToEvent(eventId, participantData) {
  if (import.meta.env.VITE_API_URL) {
    const res = await api.post(`/events/${eventId}/register/`, participantData);
    return res.data;
  }
  await delay(500);
  return { success: true, event_id: eventId, ...participantData };
}

export async function getDashboardStats() {
  if (import.meta.env.VITE_API_URL) {
    const res = await api.get("/dashboard/stats/");
    return res.data;
  }
  await delay();
  return mockDashboardStats;
}

export async function registerOrganizer(payload) {
  if (import.meta.env.VITE_API_URL) {
    const res = await api.post("/auth/register/organizer/", payload);
    return res.data;
  }
  await delay(600);
  return { success: true, ...payload };
}

const STATUS_LABELS_FR = {
  confirmed: "Confirmé",
  pending: "En attente",
  waitlist: "Liste d'attente",
};

function splitFullName(fullName) {
  const parts = fullName.trim().split(/\s+/);
  const firstName = parts[0] ?? "";
  const lastName = parts.slice(1).join(" ") || "-";
  return { firstName, lastName };
}

export function exportParticipantsCSV(eventId, participants) {
  // Séparateur ";" : celui qu'Excel en français attend par défaut.
  // Ouvert directement dans Excel (double-clic), le fichier s'affiche
  // en vraies colonnes, sans qu'aucun séparateur ne soit visible.
  const header = ["Nom", "Prénom", "Email", "Date d'inscription", "Statut"];

  const rows = participants.map((p) => {
    const { firstName, lastName } = splitFullName(p.name);
    return [
      lastName,
      firstName,
      p.email,
      p.registered_at,
      STATUS_LABELS_FR[p.status] ?? p.status,
    ]
      .map((v) => {
        const str = String(v ?? "");
        return /[;"\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
      })
      .join(";");
  });

  const csvContent = [header.join(";"), ...rows].join("\r\n");

  // Le BOM UTF-8 (\uFEFF) est indispensable pour qu'Excel affiche
  // correctement les accents (é, è, à...) à l'ouverture du fichier.
  const blob = new Blob(["\uFEFF" + csvContent], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `participants_event_${eventId}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}
export async function getMyEvents() {
  if (import.meta.env.VITE_API_URL) {
    const response = await api.get("/events/my-events");
    return response.data;
  }
  await delay();
  return mockEvents.filter((e) => e.organizer && e.organizer.id === 10);
}