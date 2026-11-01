import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Filter } from "lucide-react";
import EquipmentTable from "../components/equipment/EquipmentTable";
import EquipmentFormDialog from "../components/equipment/EquipmentFormDialog";
import AssignmentDialog from "../components/equipment/AssignmentDialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { useCurrentUser } from "@/hooks/use-current-user";
import { todayISO } from "@/lib/dates";

export default function Inventory() {
  const { isAdmin } = useCurrentUser();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [formOpen, setFormOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [editingEquipment, setEditingEquipment] = useState(null);
  const [assigningEquipment, setAssigningEquipment] = useState(null);
  const [deletingEquipment, setDeletingEquipment] = useState(null);

  const queryClient = useQueryClient();

  const { data: equipment = [], isLoading } = useQuery({
    queryKey: ["equipment"],
    queryFn: () => base44.entities.Equipment.list("-created_date"),
  });

  const { data: users = [] } = useQuery({
    queryKey: ["users"],
    queryFn: () => base44.entities.User.list(),
    enabled: isAdmin,
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Equipment.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["equipment"] });
      toast.success("Equipo registrado");
    },
    onError: () => toast.error("No se pudo registrar el equipo. Intenta de nuevo."),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Equipment.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["equipment"] });
      toast.success("Equipo actualizado");
    },
    onError: () => toast.error("No se pudo actualizar el equipo. Intenta de nuevo."),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Equipment.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["equipment"] });
      toast.success("Equipo eliminado");
    },
    onError: () => toast.error("No se pudo eliminar el equipo. Intenta de nuevo."),
  });

  const assignMutation = useMutation({
    mutationFn: async (assignmentData) => {
      await base44.entities.Assignment.create(assignmentData);
      await base44.entities.Equipment.update(assignmentData.equipment_id, {
        status: "asignado",
        assigned_to_email: assignmentData.assigned_to_email,
        assigned_to_name: assignmentData.assigned_to_name,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["equipment"] });
      queryClient.invalidateQueries({ queryKey: ["assignments"] });
      toast.success("Equipo asignado correctamente");
    },
    onError: () => toast.error("No se pudo asignar el equipo. Intenta de nuevo."),
  });

  const handleReturn = async (eq) => {
    try {
      const activeAssignments = await base44.entities.Assignment.filter({
        equipment_id: eq.id,
        status: "activa"
      });
      for (const a of activeAssignments) {
        await base44.entities.Assignment.update(a.id, {
          status: "devuelto",
          actual_return_date: todayISO(), // fecha local, no UTC
        });
      }
      await base44.entities.Equipment.update(eq.id, {
        status: "disponible",
        assigned_to_email: "",
        assigned_to_name: "",
      });
      toast.success("Equipo devuelto");
    } catch {
      toast.error("No se pudo registrar la devolución. Intenta de nuevo.");
    } finally {
      queryClient.invalidateQueries({ queryKey: ["equipment"] });
      queryClient.invalidateQueries({ queryKey: ["assignments"] });
    }
  };

  const requestDelete = (eq) => {
    if (eq.status === "asignado") {
      toast.error("Este equipo está asignado. Regístralo como devuelto antes de eliminarlo.");
      return;
    }
    setDeletingEquipment(eq);
  };

  const confirmDelete = () => {
    if (deletingEquipment) deleteMutation.mutate(deletingEquipment.id);
    setDeletingEquipment(null);
  };

  const handleSaveEquipment = async (data) => {
    if (editingEquipment) {
      await updateMutation.mutateAsync({ id: editingEquipment.id, data });
    } else {
      await createMutation.mutateAsync({ ...data, status: "disponible" });
    }
    setEditingEquipment(null);
  };

  const filtered = equipment.filter(eq => {
    const matchSearch = !search ||
      eq.name?.toLowerCase().includes(search.toLowerCase()) ||
      eq.serial_number?.toLowerCase().includes(search.toLowerCase()) ||
      eq.brand?.toLowerCase().includes(search.toLowerCase()) ||
      eq.assigned_to_name?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || eq.status === statusFilter;
    const matchType = typeFilter === "all" || eq.type === typeFilter;
    return matchSearch && matchStatus && matchType;
  });

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Inventario</h1>
          <p className="text-sm text-slate-500 mt-0.5">{equipment.length} equipos registrados</p>
        </div>
        {isAdmin && (
          <Button onClick={() => { setEditingEquipment(null); setFormOpen(true); }} className="bg-indigo-600 hover:bg-indigo-700">
            <Plus className="w-4 h-4 mr-2" /> Nuevo Equipo
          </Button>
        )}
      </div>

      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Buscar por nombre, serie, marca..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex gap-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-36">
                <Filter className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="disponible">Disponible</SelectItem>
                <SelectItem value="asignado">Asignado</SelectItem>
                <SelectItem value="en_reparacion">En Reparación</SelectItem>
                <SelectItem value="dado_de_baja">Dado de Baja</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="laptop">Laptop</SelectItem>
                <SelectItem value="desktop">Desktop</SelectItem>
                <SelectItem value="monitor">Monitor</SelectItem>
                <SelectItem value="teclado">Teclado</SelectItem>
                <SelectItem value="mouse">Mouse</SelectItem>
                <SelectItem value="impresora">Impresora</SelectItem>
                <SelectItem value="telefono">Teléfono</SelectItem>
                <SelectItem value="tablet">Tablet</SelectItem>
                <SelectItem value="proyector">Proyector</SelectItem>
                <SelectItem value="otro">Otro</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      <Card>
        <EquipmentTable
          equipment={filtered}
          isAdmin={isAdmin}
          onEdit={eq => { setEditingEquipment(eq); setFormOpen(true); }}
          onAssign={eq => { setAssigningEquipment(eq); setAssignOpen(true); }}
          onReturn={handleReturn}
          onDelete={requestDelete}
        />
      </Card>

      <EquipmentFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        equipment={editingEquipment}
        onSave={handleSaveEquipment}
      />

      <AlertDialog open={!!deletingEquipment} onOpenChange={(open) => { if (!open) setDeletingEquipment(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar este equipo?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminará {deletingEquipment?.name} ({deletingEquipment?.serial_number}) del inventario.
              Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {assigningEquipment && (
        <AssignmentDialog
          open={assignOpen}
          onOpenChange={setAssignOpen}
          equipment={assigningEquipment}
          users={users}
          onSave={data => assignMutation.mutateAsync(data)}
        />
      )}
    </div>
  );
}