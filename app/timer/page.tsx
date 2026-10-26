import { TimerApp } from "@/components/timer/TimerApp";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import { getUserProfile } from "@/app/actions";
import { Suspense } from "react";
import { isPremium } from "@/lib/plans";

export default async function TimerPage() {
  const profile = await getUserProfile();
  const isVip = isPremium(profile);

  return (
    <main className="flex flex-1 flex-col min-h-screen relative">
      <div className="absolute top-4 right-4 z-50">
        <Link 
          href={isVip ? "/vip" : "/dashboard"}
          className="flex items-center gap-2 bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 border border-indigo-500/20 px-4 py-2 rounded-full font-medium text-sm transition-colors"
        >
          <Sparkles size={16} />
          {isVip ? 'Área VIP' : 'Dashboard'}
        </Link>
      </div>
      <Suspense fallback={<div className="flex flex-1 items-center justify-center text-slate-400">Carregando Timer...</div>}>
        <TimerApp isVip={isVip} />
      </Suspense>
    </main>
  );
}
