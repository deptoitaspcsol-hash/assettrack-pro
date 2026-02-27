import React from "react";
import { PackageOpen } from "lucide-react";

export default function EmptyState({ icon: Icon = PackageOpen, title = "Sin datos", description = "No hay registros disponibles" }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="p-4 rounded-2xl bg-slate-50 mb-4">
        <Icon className="w-10 h-10 text-slate-300" />
      </div>
      <h3 className="text-base font-semibold text-slate-700 mb-1">{title}</h3>
      <p className="text-sm text-slate-400 max-w-sm">{description}</p>
    </div>
  );
}