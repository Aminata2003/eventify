// eventService.js
//
// >>> SEUL FICHIER À MODIFIER LE JOUR DE L'INTÉGRATION BACKEND <<<
//
// Toutes les pages appellent ces fonctions et ne connaissent jamais
// la source réelle des données (mock ou API Django).

import {
  mockEvents,
  mockParticipants,
  mockDashboardStats,
} from "../data/mockData";
import { api } from "./api";

const delay = (ms = 400) => new Promise((res) => setTimeout(res, ms));

export async function getEvents() {
  if (import.meta.env.VITE_API_URL) {
    const res = await api.get("/events/");
    return res.data;
  }
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

// NOUVEAU : liste des comptes déjà inscrits sur la plateforme.
// Utilisé pour choisir les invités d'un événement privé par sélection,
// au lieu de devoir taper leur email manuellement.
// Utilise le UserViewSet déjà exposé côté Django (GET /api/users/).
export async function getUsers() {
  if (import.meta.env.VITE_API_URL) {
    const res = await api.get("/users/");
    return res.data;
  }
  // Pas de liste mockée d'utilisateurs pour l'instant : cette fonctionnalité
  // nécessite le backend pour être testée avec de vraies données.
  await delay();
  return [];
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
