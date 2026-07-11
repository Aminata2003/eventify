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

import { api, BASE_URL } from "./api";
import axios from "axios";

const delay = (ms = 400) => new Promise((res) => setTimeout(res, ms));

// For development against the real backend, prefer the API by default.
// Set to `false` only if you explicitly want to use local mock data.
const USE_API = true;

function ensureValidId(id) {
  if (id === null || id === undefined) return false;
  if (typeof id === "string" && (id.trim() === "" || id === "undefined")) return false;
  return true;
}

function toFormData(payload) {
  const formData = new FormData();

  Object.entries(payload).forEach(([key, value]) => {
    if (value === null || value === undefined) {
      return;
    }

    if (Array.isArray(value) || (typeof value === "object" && !(value instanceof File))) {
      formData.append(key, JSON.stringify(value));
      return;
    }

    formData.append(key, value);
  });

  return formData;
}


// ================= EVENTS =================

export async function getEvents(search = "") {
  if (USE_API) {
    try {
      const res = await api.get("/events/", {
        params: search ? { search } : {},
      });
      return res.data;
    } catch (err) {
      if (err.response?.status === 401) {
        // retry anonymously for public endpoints
        const res2 = await axios.get(`${BASE_URL}/events/`, {
          params: search ? { search } : {},
        });
        return res2.data;
      }
      throw err;
    }
  }

  await delay();
  return mockEvents;
}


export async function getEventById(id) {
  if (USE_API) {
    if (!ensureValidId(id)) throw new Error("Invalid event id");
    try {
      const res = await api.get(`/events/${id}/`);
      return res.data;
    } catch (err) {
      if (err.response?.status === 401) {
        const res2 = await axios.get(`${BASE_URL}/events/${id}/`);
        return res2.data;
      }
      throw err;
    }
  }

  await delay();

  const event = mockEvents.find(
    (e) => String(e.id) === String(id)
  );

  if (!event) {
    throw new Error("Événement introuvable");
  }

  return event;
}


// ================= CREATE =================

export async function createEvent(payload) {

  if (USE_API) {

    if (payload.image instanceof File) {
      const formData = toFormData(payload);
      const res = await api.post("/events/", formData);
      return res.data;
    }


    const res = await api.post(
      "/events/",
      payload
    );

    return res.data;
  }


  await delay(600);

  const newEvent = {
    id: mockEvents.length + 1,
    ...payload,
  };


  mockEvents.push(newEvent);

  return newEvent;
}



// ================= UPDATE =================

export async function updateEvent(id,payload){

  if (USE_API) {
    if (!ensureValidId(id)) throw new Error("Invalid event id");
    if (payload.image instanceof File) {
      const formData = toFormData(payload);
      const res = await api.patch(`/events/${id}/`, formData);
      return res.data;
    }

    const res = await api.patch(
      `/events/${id}/`,
      payload
    );

    return res.data;
  }


  await delay();

  const index = mockEvents.findIndex(
    e=>String(e.id)===String(id)
  );


  if(index!==-1){
    mockEvents[index]={
      ...mockEvents[index],
      ...payload
    };
  }


  return mockEvents[index];
}



// ================= DELETE =================

export async function deleteEvent(id){

  if(USE_API){
    if (!ensureValidId(id)) throw new Error("Invalid event id");

    await api.delete(`/events/${id}/`);

    return true;
  }


  await delay();

  const index = mockEvents.findIndex(
    e=>String(e.id)===String(id)
  );


  if(index!==-1){
    mockEvents.splice(index,1);
  }


  return true;
}



// ================= PARTICIPANTS =================

export async function getParticipants(eventId){

  if(USE_API){
    if (!ensureValidId(eventId)) throw new Error("Invalid event id");

    const res = await api.get(
      `/events/${eventId}/participants/`
    );

    return res.data;
  }


  await delay();

  return mockParticipants;
}



// ================= REGISTER =================

export async function registerToEvent(
  eventId,
  participantData
){

  if(USE_API){
    if (!ensureValidId(eventId)) throw new Error("Invalid event id");

    const res = await api.post(
      `/events/${eventId}/register/`,
      participantData
    );

    return res.data;
  }


  await delay(500);

  return {
    success:true,
    event_id:eventId,
    ...participantData
  };
}

export async function cancelRegistration(eventId) {
  if (USE_API) {
    if (!ensureValidId(eventId)) throw new Error("Invalid event id");
    const res = await api.delete(`/events/${eventId}/cancel/`);
    return res.data;
  }
  await delay(500);
  return { success: true };
}

export async function confirmWaitlistRegistration(registrationId) {
  if (USE_API) {
    if (!ensureValidId(registrationId)) throw new Error("Invalid registration id");
    const res = await api.post(`/registrations/${registrationId}/confirm_waitlist/`);
    return res.data;
  }
  await delay(500);
  return { success: true };
}



export async function initiatePayment(eventId, payload) {
  if (USE_API) {
    if (!ensureValidId(eventId)) throw new Error("Invalid event id");
    const res = await api.post("/payments/initiate/", {
      eventId,
      ...payload,
    });
    return res.data;
  }

  await delay(500);

  return {
    sessionId: `session-${eventId}-${Date.now()}`,
    paymentReference: `REF${Date.now()}`,
    amount: payload.amount || "0",
    currency: "FCFA",
    provider: payload.provider,
    instructions:
      payload.provider === "mobile_money"
        ? `Envoyez ${payload.amount} FCFA au numéro Orange Money 77 123 45 67 ou Wave 78 123 45 67.`
        : "Cliquez sur Simuler paiement pour terminer la transaction.",
    expiresIn: 900,
  };
}

export async function confirmPayment(sessionId, confirmationCode) {
  if (USE_API) {
    const res = await api.post("/payments/confirm/", {
      sessionId,
      confirmationCode,
    });
    return res.data;
  }

  await delay(500);

  return {
    success: true,
    sessionId,
    paymentStatus: "completed",
  };
}

export async function getEventReviews(eventId) {
  if (USE_API) {
    if (!ensureValidId(eventId)) throw new Error("Invalid event id");
    const res = await api.get(`/events/${eventId}/reviews/`);
    return res.data;
  }

  await delay(400);
  return [];
}

export async function postEventReview(eventId, payload) {
  if (USE_API) {
    if (!ensureValidId(eventId)) throw new Error("Invalid event id");
    const res = await api.post(`/events/${eventId}/reviews/`, payload);
    return res.data;
  }

  await delay(400);
  return {
    id: Date.now(),
    participant: 1,
    participant_name: "Utilisateur",
    rating: payload.rating,
    comment: payload.comment,
    created_at: new Date().toISOString(),
  };
}

// ================= DASHBOARD =================

export async function getDashboardStats(){

  if(USE_API){

    const res = await api.get(
      "/dashboard/stats/"
    );

    return res.data;
  }


  await delay();

  return mockDashboardStats;
}



// ================= ORGANIZER =================

export async function registerOrganizer(payload){

  if(USE_API){

    const res = await api.post(
      "/auth/register/organizer/",
      payload
    );

    return res.data;
  }


  await delay();

  return {
    success:true,
    ...payload
  };
}



// ================= MY EVENTS =================

export async function getMyEvents(){

  if(USE_API){

    const response = await api.get(
      "/events/my-events/"
    );

    return response.data;
  }


  await delay();

  return mockEvents.filter(
    e=>e.organizer?.id===10
  );
}



// ================= USERS =================

// Liste des utilisateurs inscrits sur la plateforme
// Utilisé pour choisir les invités d'un événement privé

export async function getUsers(query = "") {
  if (USE_API) {
    // Bug getUsers corrigé : utilise /users/search/?q= au lieu de /users/ (qui est protégé)
    const res = await api.get("/users/search/", { params: query ? { q: query } : {} });
    return res.data;
  }

  await delay();

  return [];
}



// ================= EXPORT CSV =================

const STATUS_LABELS_FR = {
  confirmed:"Confirmé",
  pending:"En attente",
  waitlist:"Liste d'attente",
};


function splitFullName(fullName){

  const parts = fullName.trim().split(/\s+/);

  return {
    firstName:parts[0] || "",
    lastName:parts.slice(1).join(" ") || "-"
  };
}



export function exportParticipantsCSV(
  eventId,
  participants
){

  const header=[
    "Nom",
    "Prénom",
    "Email",
    "Date d'inscription",
    "Statut"
  ];


  const rows = participants.map(p=>{

    const {
      firstName,
      lastName
    }=splitFullName(p.name);


    return [
      lastName,
      firstName,
      p.email,
      p.registered_at,
      STATUS_LABELS_FR[p.status] || p.status
    ]
    .map(v=>`"${v ?? ""}"`)
    .join(";");

  });


  const csv=[
    header.join(";"),
    ...rows
  ].join("\r\n");


  const blob=new Blob(
    ["\uFEFF"+csv],
    {
      type:"text/csv;charset=utf-8"
    }
  );


  const url=URL.createObjectURL(blob);

  const link=document.createElement("a");

  link.href=url;

  link.download=`participants_event_${eventId}.csv`;

  link.click();

  URL.revokeObjectURL(url);
}