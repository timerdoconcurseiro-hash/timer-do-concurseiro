import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function Page() {
  return (
    <div className="min-h-screen bg-[#090C15] text-slate-200 py-12 px-4">
      <div className="max-w-3xl mx-auto space-y-8">
        <Link href="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm">
          <ArrowLeft size={16} /> Voltar
        </Link>
        <h1 className="text-3xl font-bold text-white">Contato</h1>
        <div className="prose prose-invert max-w-none text-slate-400">
          <p>Ficou com alguma dúvida ou encontrou um problema?<br/>Envie um e-mail para: timerdoconcurseiro@gmail.com</p>
        </div>
      </div>
    </div>
  );
}
