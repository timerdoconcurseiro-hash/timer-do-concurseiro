import { TimerApp } from "@/components/timer/TimerApp";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import { getUserProfile } from "@/app/actions";

export default async function TimerPage() {
  const profile = await getUserProfile();

  return (
    <main className="flex flex-1 flex-col min-h-screen relative">
      <div className="absolute top-4 right-4 z-50">
        <Link 
          href="/dashboard"
          className="flex items-center gap-2 bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 border border-indigo-500/20 px-4 py-2 rounded-full font-medium text-sm transition-colors"
        >
          <Sparkles size={16} />
          {profile?.plan === 'premium' ? 'Dashboard VIP' : 'Área VIP'}
        </Link>
      </div>
      <TimerApp />
    </main>
  );
}
