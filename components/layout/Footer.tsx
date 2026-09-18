import Link from "next/link";
import React from "react";

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="w-full border-t border-slate-800/50 bg-[#090C15] mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Copyright */}
        <div className="text-slate-500 text-sm">
          &copy; {year} Timer do Concurseiro. Todos os direitos reservados.
        </div>
        
        {/* Links Requeridos pelo Google / AdSense */}
        <nav className="flex flex-wrap items-center justify-center md:justify-end gap-x-6 gap-y-2">
          <Link href="/como-usar" className="text-sm text-slate-400 hover:text-indigo-400 transition-colors">
            Como Usar
          </Link>
          <Link href="/contato" className="text-sm text-slate-400 hover:text-indigo-400 transition-colors">
            Contato
          </Link>
          <Link href="/politica-de-privacidade" className="text-sm text-slate-400 hover:text-indigo-400 transition-colors">
            Política de Privacidade
          </Link>
          <Link href="/termos-de-uso" className="text-sm text-slate-400 hover:text-indigo-400 transition-colors">
            Termos de Uso
          </Link>
        </nav>
      </div>
    </footer>
  );
}
