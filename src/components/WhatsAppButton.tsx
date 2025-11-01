import React from 'react';
import { MessageCircle } from 'lucide-react';

export default function WhatsAppButton() {
  return (
    <a
      href="https://wa.me/201027381559"
      target="_blank"
      rel="noopener noreferrer"
      // Applied Glassmorphism style with green base color
      className="fixed bottom-6 left-6
                 p-4 rounded-full shadow-lg transition-all
                 text-white
                 bg-[#25D366]/30 backdrop-blur-md border border-white/10
                 hover:bg-[#25D366]/50
                 z-50" // Ensure it appears in the foreground
    >
      <MessageCircle className="h-6 w-6" />
    </a>
  );
}