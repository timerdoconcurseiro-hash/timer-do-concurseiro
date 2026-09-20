"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { X, Sparkles, Loader2 } from "lucide-react";

export function LeadCaptureModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  
  const supabase = createClient();

  const handleStartTrial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !consent) return;

    setIsLoading(true);
    try {
      // In a real scenario, this would create an account or send a magic link.
      // Here we assume standard passwordless or basic sign up. 
      // For lead capture, we can sign up the user with a default password or magic link.
      
      const { data, error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          data: {
            full_name: name,
            lead_capture: true,
          }
        }
      });

      if (error) throw error;
      
      alert("Enviamos um link mágico para o seu e-mail! Clique nele para ativar seu Trial de 3 Dias.");
      setIsOpen(false);
      
      // Note: The actual setting of trial_start and trial_end would ideally happen
      // via a Supabase Trigger on user creation, or a webhook, to ensure security.
      // For the frontend scope, if we were creating the user directly:
      // We can also insert into a 'leads' table for tracking.
      
      await supabase.from("leads").insert({
        name,
        email,
        consent_lgpd: consent
      });

    } catch (error: any) {
      alert("Erro: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="mt-6 underline text-slate-400 hover:text-amber-400 text-sm transition-colors"
      >
        Começar meu Teste Grátis de 3 Dias
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#0f172a] border border-slate-700 rounded-3xl p-8 w-full max-w-md shadow-2xl relative animate-in fade-in zoom-in-95">
            <button 
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 text-slate-500 hover:text-white"
            >
              <X size={20} />
            </button>
            
            <div className="text-center mb-6">
              <Sparkles className="text-amber-400 mx-auto mb-2" size={32} />
              <h2 className="text-2xl font-bold text-white">Teste Grátis - 3 Dias</h2>
              <p className="text-slate-400 text-sm mt-1">Desbloqueie a Área VIP agora mesmo.</p>
            </div>

            <form onSubmit={handleStartTrial} className="space-y-4 text-left">
              <div>
                <label className="text-xs font-semibold text-slate-400 ml-1">Nome</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Seu nome completo"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-400 ml-1">E-mail</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="Seu melhor e-mail"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex items-start gap-3 mt-2 bg-slate-900/50 p-3 rounded-xl border border-slate-800">
                <input
                  type="checkbox"
                  id="consent"
                  required
                  checked={consent}
                  onChange={e => setConsent(e.target.checked)}
                  className="mt-1 accent-amber-500"
                />
                <label htmlFor="consent" className="text-[11px] text-slate-400 leading-tight">
                  Concordo em receber comunicações e ofertas do Timer do Concurseiro. Meus dados estão protegidos de acordo com a LGPD e a Política de Privacidade.
                </label>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold py-3.5 rounded-xl shadow-[0_0_20px_rgba(245,158,11,0.3)] transition-all flex justify-center items-center gap-2 mt-4"
              >
                {isLoading ? <Loader2 className="animate-spin" size={20} /> : "Quero meu Teste Grátis"}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
