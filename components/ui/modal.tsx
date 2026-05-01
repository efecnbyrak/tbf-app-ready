"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

export function Modal({ isOpen, onClose, title, children }: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden"; // Prevent scrolling
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      {/*
        Mobil/iOS notu: Modal'ın toplam yüksekliği (header + içerik) viewport'u
        aşmasın diye flex column + max-h-[90dvh] kullanıyoruz. `dvh` adres
        çubuğunun açılıp kapanmasıyla doğru şekilde yeniden hesaplanır;
        eski `vh` iOS Safari'de bazen ekran taşmasına yol açıyordu.
      */}
      <div
        ref={overlayRef}
        className="bg-white dark:bg-zinc-900 rounded-[2rem] shadow-2xl w-full max-w-xl flex flex-col max-h-[90dvh] overflow-hidden animate-in zoom-in-95 duration-200 m-2"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b dark:border-zinc-800 shrink-0">
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">{title}</h2>
          <button
            onClick={onClose}
            className="p-2 -m-1 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            aria-label="Kapat"
          >
            <X className="w-5 h-5 text-zinc-500" />
          </button>
        </div>
        <div className="p-6 overflow-y-auto flex-1 overscroll-contain">
          {children}
        </div>
      </div>
    </div>
  );
}
