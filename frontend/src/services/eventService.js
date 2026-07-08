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

const delay = (ms = 400) => new Promise((res) => setTimeout(res, ms));

// --- Configuration API réelle (à activer plus tard) ---
// import axios from "axios";
// const api = axios.create({ baseURL: import.meta.env.VITE_API_URL });
// api.interceptors.request.use((config) => {
//   const token = localStorage.getItem("access_token");
//   if (token) config.headers.Authorization = `Bearer ${token}`;
//   return config;
// });

export async function getEvents() {
  // MOCK
  await delay();
  return mockEvents;

  // API réelle
  // const res = await api.get("/events/");
  // return res.data;
}

export async function getEventById(id) {
  // MOCK
  await delay();
  const event = mockEvents.find((e) => String(e.id) === String(id));
  if (!event) throw new Error("Événement introuvable");
  return event;

  // API réelle
  // const res = await api.get(`/events/${id}/`);
  // return res.data;
}

export async function createEvent(payload) {
  // MOCK
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

  // API réelle (avec image, on utilisera FormData)
  // const formData = new FormData();
  // Object.entries(payload).forEach(([key, value]) => formData.append(key, value));
  // const res = await api.post("/events/", formData, {
  //   headers: { "Content-Type": "multipart/form-data" },
  // });
  // return res.data;
}

export async function updateEvent(id, payload) {
  // MOCK
  await delay();
  const idx = mockEvents.findIndex((e) => String(e.id) === String(id));
  if (idx !== -1) mockEvents[idx] = { ...mockEvents[idx], ...payload };
  return mockEvents[idx];

  // API réelle
  // const res = await api.patch(`/events/${id}/`, payload);
  // return res.data;
}

export async function deleteEvent(id) {
  // MOCK
  await delay();
  const idx = mockEvents.findIndex((e) => String(e.id) === String(id));
  if (idx !== -1) mockEvents.splice(idx, 1);
  return true;

  // API réelle
  // await api.delete(`/events/${id}/`);
  // return true;
}

export async function getParticipants(eventId) {
  // MOCK
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
  await delay();
  return mockParticipants;

  // API réelle
  // const res = await api.get(`/events/${eventId}/participants/`);
  // return res.data;
}

export async function registerToEvent(eventId, participantData) {
  // MOCK
  await delay(500);
  return { success: true, event_id: eventId, ...participantData };

  // API réelle
  // const res = await api.post(`/events/${eventId}/register/`, participantData);
  // return res.data;
}

export async function getDashboardStats() {
  // MOCK
  await delay();
  return mockDashboardStats;

  // API réelle
  // const res = await api.get("/dashboard/stats/");
  // return res.data;
}

export async function registerOrganizer(payload) {
  // MOCK
  await delay(600);
  return { success: true, ...payload };

  // API réelle
  // const res = await api.post("/auth/register/organizer/", payload);
  // return res.data;
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
