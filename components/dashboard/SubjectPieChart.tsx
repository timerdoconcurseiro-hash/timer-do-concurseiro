"use client";

import React, { useState, useEffect } from "react";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis 
} from "recharts";

const MOCK_DATA = [
  { name: "Constitucional", value: 45 },
  { name: "Português", value: 30 },
  { name: "RLM", value: 20 },
  { name: "Administrativo", value: 35 },
  { name: "Informática", value: 15 },
];

export function SubjectPieChart({ data }: { data?: { name: string; value: number }[] }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return <div className="h-full w-full animate-pulse bg-slate-800/50 rounded-xl"></div>;

  const chartData = data && data.length > 0 ? data : MOCK_DATA;

  return (
    <div className="flex flex-col md:flex-row gap-6 h-full w-full">
      {/* Gráfico de Barras */}
      <div className="w-full md:w-1/2 h-full min-h-[250px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
            <XAxis 
              dataKey="name" 
              tick={{ fill: "#64748B", fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              interval={0}
              angle={-25}
              textAnchor="end"
            />
            <YAxis tick={{ fill: "#64748B", fontSize: 10 }} axisLine={false} tickLine={false} />
            <Tooltip
              cursor={{ fill: "#1E293B" }}
              contentStyle={{ backgroundColor: "#0F172A", borderColor: "#334155", borderRadius: "8px", color: "#F8FAFC" }}
              formatter={(value: any) => [`${value}h líquidas`, "Tempo"]}
            />
            <Bar dataKey="value" fill="#00E5FF" radius={[4, 4, 0, 0]} barSize={30} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Gráfico Radar */}
      <div className="w-full md:w-1/2 h-full min-h-[250px]">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="70%" data={chartData}>
            <PolarGrid stroke="#1E293B" />
            <PolarAngleAxis dataKey="name" tick={{ fill: "#94A3B8", fontSize: 10 }} />
            <PolarRadiusAxis angle={30} domain={[0, 'auto']} tick={false} axisLine={false} />
            <Radar name="Horas" dataKey="value" stroke="#8B5CF6" fill="#8B5CF6" fillOpacity={0.4} />
            <Tooltip
              contentStyle={{ backgroundColor: "#0F172A", borderColor: "#334155", borderRadius: "8px", color: "#F8FAFC" }}
              formatter={(value: any) => [`${value}h líquidas`, "Tempo"]}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
