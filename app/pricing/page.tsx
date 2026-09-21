"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { CheckCircle2, ShieldCheck, Zap, ArrowLeft, Lock } from "lucide-react";
import { VerifyPaymentButton } from "@/components/dashboard/VerifyPaymentButton";

export default function PricingPage() {
  const router = useRouter();
  
  // Flag para travar as vendas durante o beta/testes
  const isBeta = true;

  const handleBuy = async (url: string) => {
    if (isBeta) return; // Segurança extra caso o usuário remova o CSS de pointer-events

    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      // Se não está logado, força o login e manda o callback voltar para o pricing pra continuar a compra
      await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/pricing`,
        },
      });
      return;
    }
    
    // Se logado, abre a aba do Asaas
    window.location.href = url;
  };

  return (
    <div className="min-h-screen bg-[#090C15] text-slate-200 py-12 px-4 selection:bg-indigo-500/30">
      <div className="max-w-5xl mx-auto space-y-12">
        
        {/* Header */}
        <div className="text-center space-y-4">
          <Link href="/dashboard" className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm mb-6">
            <ArrowLeft size={16} /> Voltar ao Dashboard
          </Link>
          <h1 className="text-4xl md:text-5xl font-light text-white tracking-tight">
            Estude com <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">Inteligência</span>
          </h1>
          <p className="text-amber-400 max-w-2xl mx-auto text-lg font-medium">
            Conheça nossas assinaturas - Lançamento em breve!
          </p>
          <p className="text-slate-400 max-w-2xl mx-auto text-md">
            Desbloqueie projeções de edital, ciclos sugeridos por IA e sons binaurais. Foque no que importa: a sua aprovação.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          
          {/* Plano Mensal */}
          <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-8 flex flex-col backdrop-blur-sm relative transition-transform hover:scale-105">
            <h3 className="text-xl font-medium text-slate-300">Mensal</h3>
            <div className="mt-4 flex items-baseline text-4xl font-bold text-white">
              <span className="text-xl text-slate-500 font-medium mr-1">R$</span>29<span className="text-xl text-slate-500 font-medium">,90</span>
              <span className="text-sm text-slate-500 font-normal ml-1">/mês</span>
            </div>
            <p className="text-slate-400 text-sm mt-2">Acesso premium sem compromisso longo.</p>
            
            <ul className="mt-8 space-y-4 flex-1">
              <li className="flex gap-3 text-slate-300 text-sm"><CheckCircle2 className="text-indigo-400 shrink-0" size={18}/> Edital Mágico I.A. (Limites de uso justo)</li>
              <li className="flex gap-3 text-slate-300 text-sm"><CheckCircle2 className="text-indigo-400 shrink-0" size={18}/> Sala de Leitura com Flashcards</li>
              <li className="flex gap-3 text-slate-300 text-sm"><CheckCircle2 className="text-indigo-400 shrink-0" size={18}/> Smart Cycle (Revisão SM-2)</li>
              <li className="flex gap-3 text-slate-300 text-sm"><CheckCircle2 className="text-indigo-400 shrink-0" size={18}/> Player Binaural Focus</li>
            </ul>

            <button 
              onClick={() => handleBuy("https://www.asaas.com/c/yynfh4qaq959g46f")}
              disabled={isBeta}
              className={`mt-8 w-full px-6 py-4 rounded-xl font-bold transition-all text-center text-sm flex items-center justify-center gap-2
                ${isBeta ? "bg-slate-800 text-slate-400 opacity-50 cursor-not-allowed pointer-events-none border border-slate-700" : "bg-slate-800 hover:bg-slate-700 text-white border border-slate-700"}`}
            >
              {isBeta && <Lock size={16} />}
              Assinar Mensal
            </button>
          </div>

          {/* Plano Anual (Destaque) */}
          <div className="bg-gradient-to-b from-indigo-900/50 to-slate-900/80 border-2 border-indigo-500 rounded-3xl p-8 flex flex-col relative transform md:-translate-y-4 shadow-2xl shadow-indigo-900/20">
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <span className="bg-indigo-500 text-white text-xs font-bold uppercase tracking-wider py-1.5 px-4 rounded-full shadow-lg">
                Recomendado (Maior Economia)
              </span>
            </div>
            
            <h3 className="text-xl font-medium text-indigo-300 flex items-center gap-2">
              <Zap size={20} /> Anual
            </h3>
            <div className="mt-4 flex items-baseline text-5xl font-bold text-white">
              <span className="text-2xl text-indigo-300 font-medium mr-1">R$</span>147<span className="text-2xl text-indigo-300 font-medium">,00</span>
              <span className="text-sm text-indigo-200/50 font-normal ml-1">/ano</span>
            </div>
            <p className="text-emerald-400 font-medium text-sm mt-2">Equivale a apenas R$ 12,25 por mês.</p>
            
            <ul className="mt-8 space-y-4 flex-1">
              <li className="flex gap-3 text-slate-200 text-sm font-medium"><CheckCircle2 className="text-emerald-400 shrink-0" size={20}/> Todas as ferramentas premium</li>
              <li className="flex gap-3 text-slate-200 text-sm font-medium"><CheckCircle2 className="text-emerald-400 shrink-0" size={20}/> Economia de R$ 211 no ano</li>
              <li className="flex gap-3 text-slate-200 text-sm font-medium"><CheckCircle2 className="text-emerald-400 shrink-0" size={20}/> Acesso completo por 12 meses: O parceiro ideal para o seu ciclo de aprovação</li>
              <li className="flex gap-3 text-slate-200 text-sm font-medium"><CheckCircle2 className="text-emerald-400 shrink-0" size={20}/> Suporte prioritário VIP</li>
            </ul>

            <button 
              onClick={() => handleBuy("https://www.asaas.com/c/jqvvta85thlc1civ")}
              disabled={isBeta}
              className={`mt-8 w-full px-6 py-4 rounded-xl font-bold transition-all text-center text-lg flex items-center justify-center gap-2
                ${isBeta ? "bg-indigo-900/50 text-indigo-300 opacity-50 cursor-not-allowed pointer-events-none" : "bg-indigo-600 hover:bg-indigo-500 text-white transform hover:scale-105 shadow-[0_0_20px_rgba(79,70,229,0.3)]"}`}
            >
              {isBeta && <Lock size={18} />}
              Garantir Plano Anual
            </button>
          </div>

          {/* Plano Carreira */}
          <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-8 flex flex-col backdrop-blur-sm relative transition-transform hover:scale-105">
            <h3 className="text-xl font-medium text-amber-400">Plano Carreira</h3>
            <div className="mt-4 flex items-baseline text-4xl font-bold text-white">
              <span className="text-xl text-slate-500 font-medium mr-1">R$</span>497<span className="text-xl text-slate-500 font-medium">,00</span>
            </div>
            <p className="text-slate-400 text-sm mt-2">Ou em até 12x no cartão com repasse de juros.</p>
            
            <ul className="mt-8 space-y-4 flex-1">
              <li className="flex gap-3 text-slate-300 text-sm"><CheckCircle2 className="text-amber-500 shrink-0" size={18}/> Pagamento único, acesso definitivo*</li>
              <li className="flex gap-3 text-slate-300 text-sm"><CheckCircle2 className="text-amber-500 shrink-0" size={18}/> Sem renovações surpresas</li>
              <li className="flex gap-3 text-slate-300 text-sm"><CheckCircle2 className="text-amber-500 shrink-0" size={18}/> Atualizações futuras inclusas</li>
              <li className="flex gap-3 text-slate-300 text-sm"><CheckCircle2 className="text-amber-500 shrink-0" size={18}/> O seu "companheiro" definitivo de estudos</li>
            </ul>

            <button 
              onClick={() => handleBuy("https://www.asaas.com/c/vv2q0x46yc7h6oq0")}
              disabled={isBeta}
              className={`mt-8 w-full px-6 py-4 rounded-xl font-bold transition-all text-center text-sm flex items-center justify-center gap-2
                ${isBeta ? "bg-slate-800 text-slate-400 opacity-50 cursor-not-allowed pointer-events-none border border-slate-700" : "bg-slate-800 hover:bg-amber-500/20 hover:text-amber-400 hover:border-amber-500/50 text-white border border-slate-700"}`}
            >
              {isBeta && <Lock size={16} />}
              Comprar Plano Carreira
            </button>
            <p className="text-center text-[10px] text-slate-600 mt-3">* Consulte a Cláusula de Uso Aceitável (Fair Use).</p>
          </div>

        </div>

        {/* Garantia */}
        <div className="max-w-3xl mx-auto mt-12 bg-slate-900/60 border border-slate-800 rounded-2xl p-6 flex flex-col md:flex-row items-center md:items-start gap-4">
          <div className="bg-emerald-500/10 p-3 rounded-full shrink-0 mb-4 md:mb-0">
            <ShieldCheck size={32} className="text-emerald-400" />
          </div>
          <div>
            <h4 className="text-lg font-bold text-white mb-1 text-center md:text-left">Garantia Incondicional de 7 Dias (Art. 49 CDC)</h4>
            <p className="text-sm text-slate-400 leading-relaxed text-center md:text-left">
              Teste a plataforma no seu ritmo e comprove a eficiência. Se não se adaptar, devolvemos seu dinheiro sem burocracia, conforme direito de arrependimento (Art. 49 do Código de Defesa do Consumidor). Importante: a geração por IA é sujeita a uma Política de Uso Aceitável (Fair Use) para evitar abusos.
            </p>
          </div>
        </div>

        {/* Verificação de Pagamento */}
        <div className="mt-8 flex justify-center">
          <VerifyPaymentButton />
        </div>

      </div>
    </div>
  );
}
