// eventService.js

import {
  mockEvents,
  mockParticipants,
  mockDashboardStats,
} from "../data/mockData";

import { api } from "./api";

const delay = (ms = 400) => new Promise((res) => setTimeout(res, ms));

const USE_API = Boolean(import.meta.env.VITE_API_URL);


// ================= EVENTS =================

export async function getEvents(search = "") {
  if (USE_API) {
    const res = await api.get("/events/", {
      params: search ? { search } : {},
    });

    return res.data;
  }

  await delay();
  return mockEvents;
}


export async function getEventById(id) {
  if (USE_API) {
    const res = await api.get(`/events/${id}/`);
    return res.data;
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

      const formData = new FormData();

      Object.entries(payload).forEach(([key,value])=>{
        formData.append(key,value);
      });


      const res = await api.post(
        "/events/",
        formData,
        {
          headers:{
            "Content-Type":"multipart/form-data",
          },
        }
      );

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

  if(USE_API){

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