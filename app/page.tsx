import Image from "next/image";
import Link from "next/link";
import { ThemeToggle } from "@/components/theme/ThemeToggle";

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

      <Link
        href="/timer"
        className="rounded-2xl bg-gradient-to-r from-action-start to-action-end px-6 py-3 font-medium text-app-bg shadow-lg transition hover:opacity-90"
      >
        Começar a estudar
      </Link>


    </main>
  );
}
