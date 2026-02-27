import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, ArrowRightLeft, Filter } from "lucide-react";
import StatusBadge from "../components/shared/StatusBadge";
import EmptyState from "../components/shared/EmptyState";
import { format } from "date-fns";

export default function Assignments() {
  const [currentUser, setCurrentUser] = useState(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  useEffect(() => {
    base44.auth.me().then(setCurrentUser);
  }, []);

  const isAdmin = currentUser?.role === "admin";

  const { data: assignments = [] } = useQuery({
    queryKey: ["assignments"],
    queryFn: () => base44.entities.Assignment.list("-created_date"),
  });

  const filtered = assignments.filter(a => {
    const matchSearch = !search ||
      a.equipment_name?.toLowerCase().includes(search.toLowerCase()) ||
      a.assigned_to_name?.toLowerCase().includes(search.toLowerCase()) ||
      a.equipment_serial?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || a.status === statusFilter;
    const matchType = typeFilter === "all" || a.assignment_type === typeFilter;
    const matchUser = isAdmin || a.assigned_to_email === currentUser?.email;
    return matchSearch && matchStatus && matchType && matchUser;
  });

  const formatDate = (d) => {
    if (!d) return "—";
    return format(new Date(d), "dd/MM/yyyy");
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">
          {isAdmin ? "Asignaciones y Salidas" : "Mis Asignaciones"}
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">Historial de movimientos de equipos</p>
      </div>

      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Buscar por equipo, usuario, serie..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex gap-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-32">
                <Filter className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="activa">Activa</SelectItem>
                <SelectItem value="devuelto">Devuelto</SelectItem>
                <SelectItem value="cancelada">Cancelada</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los tipos</SelectItem>
                <SelectItem value="asignacion">Asignación</SelectItem>
                <SelectItem value="salida_temporal">Salida Temporal</SelectItem>
                <SelectItem value="prestamo">Préstamo</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      <Card>
        {filtered.length === 0 ? (
          <EmptyState icon={ArrowRightLeft} title="Sin movimientos" description="No hay asignaciones registradas" />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50/80">
                  <TableHead className="text-xs font-semibold text-slate-500">Equipo</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-500">Usuario</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-500">Tipo</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-500">Estado</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-500">Fecha Asignación</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-500">Devolución</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-500">Aprobó</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(a => (
                  <TableRow key={a.id} className="hover:bg-slate-50/50 transition-colors">
                    <TableCell>
                      <p className="text-sm font-medium text-slate-700">{a.equipment_name}</p>
                      <p className="text-xs text-slate-400 font-mono">{a.equipment_serial}</p>
                    </TableCell>
                    <TableCell className="text-sm text-slate-600">{a.assigned_to_name || a.assigned_to_email}</TableCell>
                    <TableCell><StatusBadge status={a.assignment_type} /></TableCell>
                    <TableCell><StatusBadge status={a.status} /></TableCell>
                    <TableCell className="text-sm text-slate-600">{formatDate(a.assignment_date)}</TableCell>
                    <TableCell className="text-sm text-slate-600">
                      {a.actual_return_date ? formatDate(a.actual_return_date) : (a.expected_return_date ? formatDate(a.expected_return_date) : "—")}
                    </TableCell>
                    <TableCell className="text-sm text-slate-500">{a.approved_by || a.created_by || "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>
    </div>
  );
}