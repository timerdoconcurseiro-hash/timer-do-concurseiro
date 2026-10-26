import React from "react";
import { Target, Sparkles, ArrowLeft } from "lucide-react";
import { EditalVerticalizado } from "@/components/dashboard/EditalVerticalizado";
import { FocusWrapper } from "@/components/dashboard/FocusWrapper";
import Link from "next/link";
import { redirect } from "next/navigation";
import { isPremium } from "@/lib/plans";
import { getUserProfile, getEditalVerticalizado } from "@/app/actions";

export default async function VIPPage() {
  const profile = await getUserProfile();

  if (!profile) {
    redirect("/login");
  }

  if (!isPremium(profile)) {
    redirect("/dashboard");
  }

  const { data: editalData } = await getEditalVerticalizado();

  return (
    <div className="min-h-screen w-full bg-[#090C15] text-slate-200 p-4 md:p-8 font-sans selection:bg-amber-500/30 overflow-y-auto">
      <div className="max-w-5xl w-full mx-auto space-y-8 pb-12">
        {/* Header - VIP */}
        <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-4 border-b border-slate-800/60">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Sparkles className="text-amber-400" size={24} />
              <h1 className="text-3xl font-light tracking-tight text-white">
                Área <span className="font-semibold text-amber-400">VIP</span>
              </h1>
            </div>
            <p className="text-slate-500 text-sm font-medium tracking-wide">
              {profile.email} • EDITAL VERTICALIZADO INTELIGENTE
            </p>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/timer"
              className="px-6 py-2.5 rounded-full border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 transition-all text-sm font-medium shadow-sm backdrop-blur-sm flex items-center gap-2"
            >
              <ArrowLeft size={16} /> Ir para o Timer
            </Link>
          </div>
        </header>

        {/* Edital Verticalizado Principal */}
        <FocusWrapper
          title={
            <>
              <Target size={16} className="text-emerald-400" /> Edital Verticalizado Inteligente
            </>
          }
        >
          <EditalVerticalizado initialData={editalData || []} />
        </FocusWrapper>
      </div>
    </div>
  );
}
