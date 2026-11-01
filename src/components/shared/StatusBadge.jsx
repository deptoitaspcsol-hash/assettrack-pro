import React from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const statusConfig = {
  disponible: { label: "Disponible", class: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  asignado: { label: "Asignado", class: "bg-blue-50 text-blue-700 border-blue-200" },
  en_reparacion: { label: "En Reparación", class: "bg-amber-50 text-amber-700 border-amber-200" },
  dado_de_baja: { label: "Dado de Baja", class: "bg-red-50 text-red-700 border-red-200" },
  activa: { label: "Activa", class: "bg-blue-50 text-blue-700 border-blue-200" },
  devuelto: { label: "Devuelto", class: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  cancelada: { label: "Cancelada", class: "bg-slate-50 text-slate-600 border-slate-200" },
  nuevo: { label: "Nuevo", class: "bg-indigo-50 text-indigo-700 border-indigo-200" },
  bueno: { label: "Bueno", class: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  regular: { label: "Regular", class: "bg-amber-50 text-amber-700 border-amber-200" },
  malo: { label: "Malo", class: "bg-red-50 text-red-700 border-red-200" },
  asignacion: { label: "Asignación", class: "bg-indigo-50 text-indigo-700 border-indigo-200" },
  salida_temporal: { label: "Salida Temporal", class: "bg-orange-50 text-orange-700 border-orange-200" },
  prestamo: { label: "Préstamo", class: "bg-violet-50 text-violet-700 border-violet-200" },
  // Estados de ticket
  abierto: { label: "Abierto", class: "bg-orange-50 text-orange-700 border-orange-200" },
  en_proceso: { label: "En Proceso", class: "bg-blue-50 text-blue-700 border-blue-200" },
  resuelto: { label: "Resuelto", class: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  cerrado: { label: "Cerrado", class: "bg-slate-50 text-slate-600 border-slate-200" },
  // Categorías de ticket
  hardware: { label: "Hardware", class: "bg-slate-50 text-slate-700 border-slate-200" },
  software: { label: "Software", class: "bg-slate-50 text-slate-700 border-slate-200" },
  red: { label: "Red", class: "bg-slate-50 text-slate-700 border-slate-200" },
  periferico: { label: "Periférico", class: "bg-slate-50 text-slate-700 border-slate-200" },
  sistema_operativo: { label: "Sistema Operativo", class: "bg-slate-50 text-slate-700 border-slate-200" },
  otro: { label: "Otro", class: "bg-slate-50 text-slate-700 border-slate-200" },
};

export default function StatusBadge({ status }) {
  const config = statusConfig[status] || { label: status, class: "bg-slate-100 text-slate-600" };
  return (
    <Badge variant="outline" className={cn("text-xs font-medium border", config.class)}>
      {config.label}
    </Badge>
  );
}