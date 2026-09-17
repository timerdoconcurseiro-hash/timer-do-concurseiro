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

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      className={`${spaceGrotesk.variable} ${inter.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="min-h-full flex flex-col bg-app-bg text-text-primary font-sans">
        {children}
      </body>
    </html>
  );
}
