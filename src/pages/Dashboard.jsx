import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Monitor, Package, UserCheck, AlertTriangle, ArrowRightLeft, Clock, CalendarClock, Laptop } from "lucide-react";
import { differenceInCalendarDays, startOfToday } from "date-fns";
import StatCard from "../components/shared/StatCard";
import StatusBadge from "../components/shared/StatusBadge";
import EmptyState from "../components/shared/EmptyState";
import { useCurrentUser } from "@/hooks/use-current-user";
import { formatDate, parseDateOnly } from "@/lib/dates";

export default function Dashboard() {
  const { currentUser, isAdmin } = useCurrentUser();
  const email = currentUser?.email;

  // Administrador: todo el inventario. Usuario: solo lo que tiene asignado.
  // (Antes "Mi Panel" mostraba las cifras de todo el inventario a cualquier usuario.)
  const { data: equipment = [] } = useQuery({
    queryKey: isAdmin ? ["equipment"] : ["my-equipment", email],
    queryFn: () =>
      isAdmin
        ? base44.entities.Equipment.list("-created_date")
        : base44.entities.Equipment.filter({ assigned_to_email: email }),
    enabled: !!currentUser,
  });

  // Claves propias ("recent"/"active"): la página Asignaciones usa ["assignments"] con otra consulta.
  const { data: recentAssignments = [] } = useQuery({
    queryKey: ["assignments", "recent", isAdmin ? "all" : email],
    queryFn: () =>
      isAdmin
        ? base44.entities.Assignment.list("-created_date", 6)
        : base44.entities.Assignment.filter({ assigned_to_email: email }, "-created_date", 6),
    enabled: !!currentUser,
  });

  const { data: activeAssignments = [] } = useQuery({
    queryKey: ["assignments", "active", isAdmin ? "all" : email],
    queryFn: () =>
      isAdmin
        ? base44.entities.Assignment.filter({ status: "activa" })
        : base44.entities.Assignment.filter({ status: "activa", assigned_to_email: email }),
    enabled: !!currentUser,
  });

  const stats = {
    total: equipment.length,
    available: equipment.filter(e => e.status === "disponible").length,
    assigned: equipment.filter(e => e.status === "asignado").length,
    repair: equipment.filter(e => e.status === "en_reparacion").length,
  };

  // Devoluciones cuya fecha esperada ya pasó y siguen activas.
  const today = startOfToday();
  const overdue = activeAssignments
    .map(a => ({ ...a, dueDate: parseDateOnly(a.expected_return_date) }))
    .filter(a => a.dueDate && a.dueDate < today)
    .sort((a, b) => a.dueDate - b.dueDate)
    .map(a => ({ ...a, daysLate: differenceInCalendarDays(today, a.dueDate) }));

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

      {isAdmin ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Total Equipos" value={stats.total} icon={Package} color="bg-indigo-500" />
          <StatCard title="Disponibles" value={stats.available} icon={Monitor} color="bg-emerald-500" />
          <StatCard title="Asignados" value={stats.assigned} icon={UserCheck} color="bg-blue-500" />
          <StatCard title="En Reparación" value={stats.repair} icon={AlertTriangle} color="bg-amber-500" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard title="Mis Equipos" value={stats.total} icon={Laptop} color="bg-indigo-500" />
          <StatCard title="Movimientos Activos" value={activeAssignments.length} icon={ArrowRightLeft} color="bg-blue-500" />
          <StatCard
            title="Devoluciones Vencidas"
            value={overdue.length}
            icon={CalendarClock}
            color={overdue.length > 0 ? "bg-red-500" : "bg-emerald-500"}
          />
        </div>
      )}

      {overdue.length > 0 && (
        <Card className="border-red-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2 text-red-700">
              <CalendarClock className="w-4 h-4" />
              {isAdmin ? "Devoluciones vencidas" : "Tienes devoluciones vencidas"}
              <span className="text-xs font-medium bg-red-50 text-red-700 border border-red-200 rounded-full px-2 py-0.5">
                {overdue.length}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {overdue.slice(0, 5).map(a => (
                <div key={a.id} className="flex items-center justify-between gap-3 p-3 rounded-lg bg-red-50/50">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-700 truncate">{a.equipment_name}</p>
                    <p className="text-xs text-slate-500 truncate">{a.assigned_to_name || a.assigned_to_email}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs font-semibold text-red-700">
                      {a.daysLate} {a.daysLate === 1 ? "día" : "días"} de retraso
                    </p>
                    <p className="text-xs text-slate-400">Debía regresar el {formatDate(a.expected_return_date)}</p>
                  </div>
                </div>
              ))}
              {overdue.length > 5 && (
                <p className="text-xs text-slate-400 text-center pt-1">y {overdue.length - 5} más en Asignaciones</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

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
                  <div key={a.id} className="flex items-center justify-between gap-2 p-3 rounded-lg bg-slate-50/80 hover:bg-slate-100/80 transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="p-1.5 rounded-lg bg-indigo-50">
                        <ArrowRightLeft className="w-3.5 h-3.5 text-indigo-500" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-700 truncate">{a.equipment_name}</p>
                        <p className="text-xs text-slate-400 truncate">
                          {a.assigned_to_name || a.assigned_to_email} · {formatDate(a.assignment_date)}
                        </p>
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
              <EmptyState
                icon={Package}
                title="Sin equipos"
                description={isAdmin ? "Registra tu primer equipo" : "No tienes equipos asignados"}
              />
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
