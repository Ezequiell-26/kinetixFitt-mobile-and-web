"use client";
import { MessageCircle } from "lucide-react";

export function WhatsappFloat() {
  const number = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER?.replace(/\D/g, "");
  if (!number) return null;

  const message = encodeURIComponent("Hola KinetixFitt");
  return (
    <a
      href={`https://wa.me/${number}?text=${message}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Contactar a KinetixFitt por WhatsApp"
      className="fixed bottom-[88px] right-3 z-30 flex h-12 w-12 items-center justify-center rounded-full bg-[#25D366] shadow-lg transition hover:scale-105 lg:bottom-6"
    >
      <MessageCircle size={24} className="text-white" fill="currentColor" aria-hidden="true" />
    </a>
  );
}
