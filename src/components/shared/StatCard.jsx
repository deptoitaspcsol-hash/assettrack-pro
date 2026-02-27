import React from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export default function StatCard({ title, value, icon: Icon, color = "bg-indigo-500", subtitle }) {
  return (
    <Card className="relative overflow-hidden group hover:shadow-lg transition-all duration-300">
      <div className={cn("absolute top-0 right-0 w-24 h-24 rounded-full opacity-10 transform translate-x-6 -translate-y-6", color)} />
      <div className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-xs font-medium uppercase tracking-wider text-slate-400">{title}</p>
            <p className="text-3xl font-bold text-slate-800">{value}</p>
            {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
          </div>
          <div className={cn("p-2.5 rounded-xl", color, "bg-opacity-10")}>
            <Icon className={cn("w-5 h-5", color.replace("bg-", "text-"))} />
          </div>
        </div>
      </div>
    </Card>
  );
}