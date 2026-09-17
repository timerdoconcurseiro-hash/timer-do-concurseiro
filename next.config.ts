import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

const nextConfig: NextConfig = {
  // O plugin de PWA injeta config.webpack; em dev usamos Turbopack (PWA fica
  // desabilitado nesse modo), então só silenciamos o aviso de conflito aqui.
  // O build de produção roda explicitamente com `next build --webpack`
  // (necessário para o Workbox gerar o service worker).
  turbopack: {},
};

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  cacheOnFrontEndNav: true,
  reloadOnOnline: true,
  workboxOptions: {
    disableDevLogs: true,
  },
});

export default withPWA(nextConfig);
