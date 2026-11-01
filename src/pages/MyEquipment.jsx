import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Laptop, Monitor, Printer, Smartphone, Tablet, Mouse, Keyboard, Video, HardDrive, Calendar, Hash } from "lucide-react";
import StatusBadge from "../components/shared/StatusBadge";
import EmptyState from "../components/shared/EmptyState";
import { useCurrentUser } from "@/hooks/use-current-user";
import { formatDate } from "@/lib/dates";

const typeIcons = {
  laptop: Laptop, desktop: HardDrive, monitor: Monitor, teclado: Keyboard,
  mouse: Mouse, impresora: Printer, telefono: Smartphone, tablet: Tablet,
  proyector: Video, otro: HardDrive,
};

export default function MyEquipment() {
  const { currentUser } = useCurrentUser();

  const { data: equipment = [] } = useQuery({
    queryKey: ["my-equipment", currentUser?.email],
    queryFn: () => base44.entities.Equipment.filter({ assigned_to_email: currentUser.email }),
    enabled: !!currentUser?.email,
  });

  const { data: assignments = [] } = useQuery({
    queryKey: ["my-assignments", currentUser?.email],
    queryFn: () => base44.entities.Assignment.filter({ assigned_to_email: currentUser.email, status: "activa" }),
    enabled: !!currentUser?.email,
  });

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Mi Equipo</h1>
        <p className="text-sm text-slate-500 mt-0.5">Equipos asignados a ti actualmente</p>
      </div>

      {equipment.length === 0 ? (
        <Card>
          <EmptyState
            icon={Laptop}
            title="Sin equipos asignados"
            description="No tienes equipos de cómputo asignados en este momento"
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {equipment.map(eq => {
            const Icon = typeIcons[eq.type] || HardDrive;
            const assignment = assignments.find(a => a.equipment_id === eq.id);
            return (
              <Card key={eq.id} className="hover:shadow-md transition-all duration-300 overflow-hidden">
                <div className="h-1.5 bg-indigo-500" />
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-indigo-50">
                        <Icon className="w-5 h-5 text-indigo-600" />
                      </div>
                      <div>
                        <CardTitle className="text-base">{eq.name}</CardTitle>
                        <p className="text-xs text-slate-400 mt-0.5">{eq.brand} {eq.model}</p>
                      </div>
                    </div>
                    <StatusBadge status={eq.condition} />
                  </div>
                </CardHeader>
                <CardContent className="pt-0 space-y-2">
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Hash className="w-3.5 h-3.5 text-slate-400" />
                    <span className="font-mono text-xs">{eq.serial_number}</span>
                  </div>
                  {assignment && (
                    <>
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span className="text-xs">
                          Desde {formatDate(assignment.assignment_date)}
                        </span>
                      </div>
                      {assignment.expected_return_date && (
                        <p className="text-xs text-slate-400">
                          Devolución esperada: {formatDate(assignment.expected_return_date)}
                        </p>
                      )}
                    </>
                  )}
                  {assignment && <StatusBadge status={assignment.assignment_type} />}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}