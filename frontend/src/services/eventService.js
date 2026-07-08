import {
  mockEvents,
  mockParticipants,
  mockDashboardStats,
  mockParticipantRegistrations,
} from "../data/mockData";

const delay = (ms = 400) => new Promise((res) => setTimeout(res, ms));

export async function getEvents() {
  await delay();
  return [...mockEvents];
}

export async function getPublicEvents() {
  await delay();
  return mockEvents.filter((e) => e.is_public && e.status === "published");
}

export async function getEventById(id) {
  await delay();
  const event = mockEvents.find((e) => String(e.id) === String(id));
  if (!event) throw new Error("Événement introuvable");
  return event;
}

export async function getMyEvents(type = "upcoming") {
  await delay();
  const ids =
    type === "upcoming"
      ? mockParticipantRegistrations.upcoming
      : mockParticipantRegistrations.past;
  return mockEvents.filter((e) => ids.includes(e.id));
}

export async function createEvent(payload) {
  await delay(600);
  const newEvent = {
    id: mockEvents.length + 1,
    views_count: 0,
    registrations_count: 0,
    status: "draft",
    organizer: { id: 10, name: "Vous", avatar: null },
    price_currency: "FCFA",
    ...payload,
  };
  mockEvents.push(newEvent);
  return newEvent;
}

export async function updateEvent(id, payload) {
  await delay();
  const idx = mockEvents.findIndex((e) => String(e.id) === String(id));
  if (idx !== -1) mockEvents[idx] = { ...mockEvents[idx], ...payload };
  return mockEvents[idx];
}

export async function deleteEvent(id) {
  await delay();
  const idx = mockEvents.findIndex((e) => String(e.id) === String(id));
  if (idx !== -1) mockEvents.splice(idx, 1);
  return true;
}

export async function getParticipants(eventId) {
  await delay();
  return mockParticipants;
}

export async function registerToEvent(eventId, participantData) {
  await delay(500);
  if (!mockParticipantRegistrations.upcoming.includes(Number(eventId))) {
    mockParticipantRegistrations.upcoming.push(Number(eventId));
  }
  return { success: true, event_id: eventId, ...participantData };
}

export async function getDashboardStats() {
  await delay();
  return mockDashboardStats;
}

export async function registerOrganizer(payload) {
  await delay(600);
  return { success: true, role: "organizer", ...payload };
}

export async function registerParticipant(payload) {
  await delay(600);
  return { success: true, role: "participant", ...payload };
}

export async function loginUser({ email }) {
  await delay(400);
  const role = email.toLowerCase().includes("org") ? "organizer" : "participant";
  return { email, role };
}

export function exportParticipantsCSV(eventId, participants) {
  const header = "Nom,Email,Date d'inscription,Statut\n";
  const rows = participants
    .map((p) => `${p.name},${p.email},${p.registered_at},${p.status}`)
    .join("\n");
  const blob = new Blob([header + rows], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `participants_event_${eventId}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}
