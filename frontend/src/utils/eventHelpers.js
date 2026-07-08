const MONTHS_FR = [
  "janv.",
  "févr.",
  "mars",
  "avr.",
  "mai",
  "juin",
  "juil.",
  "août",
  "sept.",
  "oct.",
  "nov.",
  "déc.",
];

export function formatDateLabel(dateStr) {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return dateStr;
  return `${date.getDate()} ${MONTHS_FR[date.getMonth()]}`;
}

export function formatTimeLabel(timeStr) {
  if (!timeStr) return "";
  const match = timeStr.match(/^(\d{1,2}):(\d{2})/);
  if (!match) return timeStr;
  return `${match[1]}h${match[2]}`;
}

export function formatPrice(event) {
  if (!event || event.price === 0 || event.price === "0") return "Gratuit";
  if (typeof event.price === "string") return event.price;
  const currency = event.price_currency || "FCFA";
  const formatted = new Intl.NumberFormat("fr-FR").format(event.price);
  return `${formatted} ${currency}`;
}

export function getEventCta(event) {
  const price = formatPrice(event);
  if (price === "Gratuit") return "S'inscrire";
  if (price === "Don") return "Billets";
  return "Réserver";
}

export function getVenue(event) {
  return event.venue || event.location || "";
}

export function getCity(event) {
  const location = event.location || "";
  const parts = location.split(",");
  return parts[parts.length - 1]?.trim() || location;
}
