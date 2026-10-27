import React, { Suspense } from "react";
import { PricingSection } from "@/components/billing/PricingSection";

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 text-slate-400 flex items-center justify-center text-sm">
          Preparando checkout Pix...
        </div>
      }
    >
      <PricingSection showBackLink />
    </Suspense>
  );
}
