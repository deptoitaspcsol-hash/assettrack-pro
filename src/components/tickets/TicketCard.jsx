import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Monitor, Calendar, Wrench, ChevronRight } from "lucide-react";
import StatusBadge from "../shared/StatusBadge";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

const priorityConfig = {
  baja: { label: "Baja", class: "bg-slate-100 text-slate-600 border-slate-200" },
  media: { label: "Media", class: "bg-blue-100 text-blue-700 border-blue-200" },
  alta: { label: "Alta", class: "bg-amber-100 text-amber-700 border-amber-200" },
  critica: { label: "Crítica", class: "bg-red-100 text-red-700 border-red-200 animate-pulse" },
};

const statusBar = {
  abierto: "bg-orange-500",
  en_proceso: "bg-blue-500",
  resuelto: "bg-emerald-500",
  cerrado: "bg-slate-400",
};

export default function TicketCard({ ticket, onClick }) {
  const p = priorityConfig[ticket.priority] || priorityConfig.media;
  return (
    <Card onClick={onClick} className="cursor-pointer hover:shadow-md transition-all duration-200 overflow-hidden group">
      <div className={cn("h-1", statusBar[ticket.status] || "bg-slate-300")} />
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <StatusBadge status={ticket.status} />
              <Badge variant="outline" className={cn("text-xs border", p.class)}>{p.label}</Badge>
            </div>
            <p className="font-semibold text-sm text-slate-800 truncate">{ticket.title}</p>
            <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{ticket.description}</p>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 flex-shrink-0 mt-1 transition-colors" />
        </div>
        <div className="flex flex-wrap gap-3 mt-3 text-xs text-slate-500">
          <span className="flex items-center gap-1"><Monitor className="w-3 h-3" />{ticket.equipment_name}</span>
          {ticket.technician_name && (
            <span className="flex items-center gap-1"><Wrench className="w-3 h-3" />{ticket.technician_name}</span>
          )}
          <span className="flex items-center gap-1 ml-auto">
            <Calendar className="w-3 h-3" />
            {ticket.created_date ? format(new Date(ticket.created_date), "dd/MM/yy") : "—"}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}