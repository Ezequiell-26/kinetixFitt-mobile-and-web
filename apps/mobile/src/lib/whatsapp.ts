const WHATSAPP_NUMBER = (process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "").replace(/\D/g, "");

/**
 * Builds a WhatsApp support link only when a real public support number is configured.
 * Empty by default so production never exposes an invalid placeholder contact.
 */
export function getWhatsAppHref(message = "Hola KinetixFitt") {
  if (!WHATSAPP_NUMBER) return null;
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}
