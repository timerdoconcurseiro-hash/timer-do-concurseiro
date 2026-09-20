import Image from "next/image";
import Link from "next/link";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { LeadCaptureModal } from "@/components/layout/LeadCaptureModal";

export default function Home() {
  return (
    <main className="relative flex flex-1 flex-col items-center justify-center gap-8 px-6 py-16 text-center">
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>

      <Image
        src="/logo.png"
        alt="Timer do Concurseiro"
        width={140}
        height={140}
        priority
        className="rounded-full shadow-[0_0_40px_rgba(56,189,248,0.35)]"
      />

      <div className="space-y-3">
        <h1 className="font-display text-3xl font-semibold tracking-tight text-text-primary sm:text-4xl">
          Timer do Concurseiro
        </h1>
        <p className="mx-auto max-w-md text-balance text-text-secondary">
          O seu ambiente blindado contra distrações. Feito para a sua
          aprovação.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mt-4">
        <Link
          href="/pricing"
          className="rounded-full bg-indigo-600 px-8 py-3.5 font-bold text-white shadow-[0_0_30px_rgba(79,70,229,0.3)] transition-all hover:scale-105 hover:bg-indigo-500 text-center"
        >
          Desbloquear Área VIP
        </Link>
        <Link
          href="/timer"
          className="rounded-full border border-slate-700 bg-slate-900/50 px-8 py-3.5 font-medium text-slate-300 shadow-lg backdrop-blur-sm transition-all hover:bg-slate-800 hover:text-white text-center"
        >
          Usar Timer Grátis
        </Link>
        <Link
          href="/login"
          className="rounded-full border border-amber-500/50 bg-amber-500/10 px-8 py-3.5 font-medium text-amber-400 shadow-lg backdrop-blur-sm transition-all hover:bg-amber-500/20 text-center"
        >
          Já sou VIP (Login)
        </Link>
      </div>

      <LeadCaptureModal />
    </main>
  );
}
