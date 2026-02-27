import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Monitor, Package, UserCheck, AlertTriangle, ArrowRightLeft, Clock } from "lucide-react";
import StatCard from "../components/shared/StatCard";
import StatusBadge from "../components/shared/StatusBadge";
import EmptyState from "../components/shared/EmptyState";
import { format } from "date-fns";

export default function Dashboard() {
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setCurrentUser);
  }, []);

  const { data: equipment = [] } = useQuery({
    queryKey: ["equipment"],
    queryFn: () => base44.entities.Equipment.list("-created_date"),
  });

  const { data: assignments = [] } = useQuery({
    queryKey: ["assignments"],
    queryFn: () => base44.entities.Assignment.list("-created_date", 10),
  });

  const isAdmin = currentUser?.role === "admin";

  const stats = {
    total: equipment.length,
    available: equipment.filter(e => e.status === "disponible").length,
    assigned: equipment.filter(e => e.status === "asignado").length,
    repair: equipment.filter(e => e.status === "en_reparacion").length,
  };

  const recentAssignments = assignments.slice(0, 6);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">
          {isAdmin ? "Panel de Control" : "Mi Panel"}
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          {isAdmin ? "Resumen general del inventario de equipos" : "Tu equipo asignado y estado"}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Equipos" value={stats.total} icon={Package} color="bg-indigo-500" />
        <StatCard title="Disponibles" value={stats.available} icon={Monitor} color="bg-emerald-500" />
        <StatCard title="Asignados" value={stats.assigned} icon={UserCheck} color="bg-blue-500" />
        <StatCard title="En Reparación" value={stats.repair} icon={AlertTriangle} color="bg-amber-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <ArrowRightLeft className="w-4 h-4 text-indigo-500" />
              Últimos Movimientos
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentAssignments.length === 0 ? (
              <EmptyState icon={Clock} title="Sin movimientos" description="No hay movimientos registrados" />
            ) : (
              <div className="space-y-3">
                {recentAssignments.map(a => (
                  <div key={a.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-50/80 hover:bg-slate-100/80 transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="p-1.5 rounded-lg bg-indigo-50">
                        <ArrowRightLeft className="w-3.5 h-3.5 text-indigo-500" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-700 truncate">{a.equipment_name}</p>
                        <p className="text-xs text-slate-400 truncate">{a.assigned_to_name || a.assigned_to_email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <StatusBadge status={a.assignment_type} />
                      <StatusBadge status={a.status} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Package className="w-4 h-4 text-indigo-500" />
              Distribución por Tipo
            </CardTitle>
          </CardHeader>
          <CardContent>
            {equipment.length === 0 ? (
              <EmptyState icon={Package} title="Sin equipos" description="Registra tu primer equipo" />
            ) : (
              <div className="space-y-2">
                {Object.entries(
                  equipment.reduce((acc, eq) => {
                    acc[eq.type] = (acc[eq.type] || 0) + 1;
                    return acc;
                  }, {})
                ).sort((a, b) => b[1] - a[1]).map(([type, count]) => (
                  <div key={type} className="flex items-center justify-between py-2">
                    <span className="text-sm capitalize text-slate-600">{type}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-indigo-500 transition-all"
                          style={{ width: `${(count / equipment.length) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm font-semibold text-slate-700 w-6 text-right">{count}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}