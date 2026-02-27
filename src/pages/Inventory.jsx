import React, { useState, useEffect } from "react";
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
import { toast } from "sonner";

export default function Inventory() {
  const [currentUser, setCurrentUser] = useState(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [formOpen, setFormOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [editingEquipment, setEditingEquipment] = useState(null);
  const [assigningEquipment, setAssigningEquipment] = useState(null);

  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setCurrentUser);
  }, []);

  const isAdmin = currentUser?.role === "admin";

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
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Equipment.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["equipment"] });
      toast.success("Equipo actualizado");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Equipment.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["equipment"] });
      toast.success("Equipo eliminado");
    },
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
  });

  const handleReturn = async (eq) => {
    const activeAssignments = await base44.entities.Assignment.filter({
      equipment_id: eq.id,
      status: "activa"
    });
    for (const a of activeAssignments) {
      await base44.entities.Assignment.update(a.id, {
        status: "devuelto",
        actual_return_date: new Date().toISOString().split("T")[0],
      });
    }
    await base44.entities.Equipment.update(eq.id, {
      status: "disponible",
      assigned_to_email: "",
      assigned_to_name: "",
    });
    queryClient.invalidateQueries({ queryKey: ["equipment"] });
    queryClient.invalidateQueries({ queryKey: ["assignments"] });
    toast.success("Equipo devuelto");
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
          onDelete={eq => deleteMutation.mutate(eq.id)}
        />
      </Card>

      <EquipmentFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        equipment={editingEquipment}
        onSave={handleSaveEquipment}
      />

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