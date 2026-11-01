import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { todayISO } from "@/lib/dates";

export default function AssignmentDialog({ open, onOpenChange, equipment, users, onSave }) {
  const [form, setForm] = useState({
    assigned_to_email: "",
    assignment_type: "asignacion",
    assignment_date: todayISO(),
    expected_return_date: "",
    notes: ""
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setForm({
        assigned_to_email: "",
        assignment_type: "asignacion",
        assignment_date: todayISO(),
        expected_return_date: "",
        notes: ""
      });
    }
  }, [open]);

  const handleSave = async () => {
    setSaving(true);
    const selectedUser = users.find(u => u.email === form.assigned_to_email);
    try {
      await onSave({
        ...form,
        equipment_id: equipment.id,
        equipment_name: equipment.name,
        equipment_serial: equipment.serial_number,
        assigned_to_name: selectedUser?.full_name || form.assigned_to_email,
        status: "activa"
      });
      onOpenChange(false);
    } catch {
      // Quien guarda ya muestra el aviso de error; el diálogo queda abierto para reintentar.
    } finally {
      setSaving(false);
    }
  };

  const update = (key, value) => setForm(prev => ({ ...prev, [key]: value }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg">Asignar Equipo</DialogTitle>
          <p className="text-sm text-slate-500 mt-1">{equipment?.name} — {equipment?.serial_number}</p>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="space-y-1.5">
            <Label className="text-xs">Asignar a *</Label>
            <Select value={form.assigned_to_email} onValueChange={v => update("assigned_to_email", v)}>
              <SelectTrigger><SelectValue placeholder="Seleccionar usuario" /></SelectTrigger>
              <SelectContent>
                {users.map(u => (
                  <SelectItem key={u.id} value={u.email}>{u.full_name || u.email}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Tipo de Movimiento</Label>
            <Select value={form.assignment_type} onValueChange={v => update("assignment_type", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="asignacion">Asignación</SelectItem>
                <SelectItem value="salida_temporal">Salida Temporal</SelectItem>
                <SelectItem value="prestamo">Préstamo</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Fecha Asignación</Label>
              <Input type="date" value={form.assignment_date} onChange={e => update("assignment_date", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Fecha Devolución</Label>
              <Input type="date" value={form.expected_return_date} onChange={e => update("expected_return_date", e.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Notas</Label>
            <Textarea value={form.notes} onChange={e => update("notes", e.target.value)} rows={2} placeholder="Motivo de la asignación..." />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSave} disabled={saving || !form.assigned_to_email} className="bg-indigo-600 hover:bg-indigo-700">
            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Asignar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}