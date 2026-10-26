"use client";

import React from "react";
import type { EditalSubject } from "@/app/actions";
import { EditalBoard } from "@/components/edital/EditalBoard";

export function EditalVerticalizado({
  initialData,
  initialExamName,
}: {
  initialData: EditalSubject[];
  initialExamName?: string;
}) {
  return <EditalBoard initialData={initialData} initialExamName={initialExamName} />;
}
