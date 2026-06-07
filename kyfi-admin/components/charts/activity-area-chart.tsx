"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { monthlyActivity } from "@/data/mock-data";

type ActivityPoint = {
  month: string;
  farmers?: number;
  oldFarmers?: number;
  newFarmers?: number;
};

export function ActivityAreaChart({
  data = monthlyActivity,
}: {
  data?: ActivityPoint[];
}) {
  const chartData = data.map((point) => ({
    ...point,
    oldFarmers: point.oldFarmers ?? point.farmers ?? 0,
    newFarmers: point.newFarmers ?? 0,
  }));

  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ left: -20, right: 10 }}>
          <defs>
            <linearGradient id="oldFarmers" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#047857" stopOpacity={0.32} />
              <stop offset="95%" stopColor="#047857" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="newFarmers" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#2563EB" stopOpacity={0.26} />
              <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis dataKey="month" tickLine={false} axisLine={false} />
          <YAxis tickLine={false} axisLine={false} />
          <Tooltip
            contentStyle={{
              borderRadius: 8,
              border: "1px solid hsl(var(--border))",
            }}
          />
          <Legend />
          <Area
            type="monotone"
            dataKey="oldFarmers"
            name="Old Farmers"
            stroke="#047857"
            fill="url(#oldFarmers)"
            strokeWidth={2}
          />
          <Area
            type="monotone"
            dataKey="newFarmers"
            name="New Farmers"
            stroke="#2563EB"
            fill="url(#newFarmers)"
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
