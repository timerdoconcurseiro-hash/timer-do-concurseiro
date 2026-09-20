import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import { themeInitScript } from "@/lib/theme/constants";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Timer do Concurseiro",
  description: "O melhor timer para horas líquidas de estudo.",
};

export const viewport = {
  themeColor: "#0F172A",
};

import { Footer } from "@/components/layout/Footer";

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      className={`${spaceGrotesk.variable} ${inter.variable} min-h-screen antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="min-h-screen flex flex-col bg-app-bg text-text-primary font-sans overflow-y-auto">
        <div className="flex-1 flex flex-col w-full">
          {children}
        </div>
        <Footer />
      </body>
    </html>
  );
}
