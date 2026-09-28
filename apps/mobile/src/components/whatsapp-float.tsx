import { MessageCircle } from "lucide-react";
import { getWhatsAppHref } from "@/lib/whatsapp";

export function WhatsappFloat() {
  const href = getWhatsAppHref();
  if (!href) return null;

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      aria-label="Contactar a KinetixFitt por WhatsApp"
      className="fixed bottom-[88px] right-3 z-30 flex h-12 w-12 items-center justify-center rounded-full bg-[#25D366] shadow-lg transition hover:scale-105 lg:bottom-6"
    >
      <MessageCircle
        size={24}
        className="text-white"
        fill="currentColor"
        aria-hidden="true"
      />
    </a>
  );
}
