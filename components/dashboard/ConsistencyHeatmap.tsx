"use client";

import React from "react";

// Helper to generate a mock year of data
function generateMockHeatmap() {
  const weeks = [];
  for (let w = 0; w < 52; w++) {
    const days = [];
    for (let d = 0; d < 7; d++) {
      // Randomly assign an intensity 0-4
      // Heavily weighted towards 0 and 1, sometimes 2-4
      const rand = Math.random();
      let intensity = 0;
      if (rand > 0.4 && rand < 0.7) intensity = 1;
      else if (rand >= 0.7 && rand < 0.85) intensity = 2;
      else if (rand >= 0.85 && rand < 0.95) intensity = 3;
      else if (rand >= 0.95) intensity = 4;
      
      days.push(intensity);
    }
    weeks.push(days);
  }
  return weeks;
}

const HEATMAP_DATA = generateMockHeatmap();
const INTENSITY_COLORS = [
  "bg-slate-800",       // 0
  "bg-emerald-900/40",  // 1
  "bg-emerald-700/60",  // 2
  "bg-emerald-500",     // 3
  "bg-emerald-400",     // 4
];

export function ConsistencyHeatmap() {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-1 overflow-hidden">
        {HEATMAP_DATA.map((week, wIndex) => (
          <div key={wIndex} className="flex flex-col gap-1">
            {week.map((intensity, dIndex) => (
              <div
                key={dIndex}
                className={`w-3 h-3 rounded-sm ${INTENSITY_COLORS[intensity]} transition-colors hover:ring-2 hover:ring-white`}
                title={`Intensidade: ${intensity}`}
              />
            ))}
          </div>
        ))}
      </div>
      
      <div className="flex justify-end items-center gap-2 mt-2 text-xs text-slate-400">
        <span>Menos</span>
        <div className="flex gap-1">
          {INTENSITY_COLORS.map((color, i) => (
            <div key={i} className={`w-3 h-3 rounded-sm ${color}`} />
          ))}
        </div>
        <span>Mais foco</span>
      </div>
    </div>
  );
}
