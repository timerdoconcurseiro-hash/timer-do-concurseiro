"use client";

import React, { useState, useEffect } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";

const MOCK_DATA = [
  { name: "Direito Constitucional", value: 45 }, // hours
  { name: "Português", value: 30 },
  { name: "Raciocínio Lógico", value: 20 },
  { name: "Direito Administrativo", value: 35 },
  { name: "Informática", value: 15 },
];

const COLORS = ["#00E5FF", "#10B981", "#8B5CF6", "#F59E0B", "#F43F5E"];

export function SubjectPieChart({ data }: { data?: { name: string; value: number }[] }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return <div className="h-full w-full animate-pulse bg-slate-800/50 rounded-xl"></div>;

  const chartData = data && data.length > 0 ? data : MOCK_DATA;

  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={100}
          paddingAngle={5}
          dataKey="value"
          stroke="transparent"
        >
          {MOCK_DATA.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{ backgroundColor: "#1E293B", borderColor: "#334155", borderRadius: "8px", color: "#F8FAFC" }}
          itemStyle={{ color: "#F8FAFC" }}
          formatter={(value: number) => [`${value}h líquidas`, "Tempo"]}
        />
        <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: "12px", paddingTop: "20px" }} />
      </PieChart>
    </ResponsiveContainer>
  );
}
