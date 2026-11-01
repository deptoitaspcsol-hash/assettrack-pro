import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";

const categories = [
  { value: "hardware", label: "Hardware" },
  { value: "software", label: "Software" },
  { value: "red", label: "Red / Conectividad" },
  { value: "periferico", label: "Periférico" },
  { value: "sistema_operativo", label: "Sistema Operativo" },
  { value: "otro", label: "Otro" },
];

const priorities = [
  { value: "baja", label: "Baja" },
  { value: "media", label: "Media" },
  { value: "alta", label: "Alta" },
  { value: "critica", label: "Crítica" },
];

export default function TicketFormDialog({ open, onOpenChange, myEquipment, onSave }) {
  const [form, setForm] = useState({
    title: "", description: "", category: "hardware", priority: "media",
    equipment_id: "", equipment_name: "", equipment_serial: ""
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setForm({ title: "", description: "", category: "hardware", priority: "media", equipment_id: "", equipment_name: "", equipment_serial: "" });
    }
  }, [open]);

  const handleEquipmentChange = (id) => {
    const eq = myEquipment.find(e => e.id === id);
    setForm(prev => ({
      ...prev,
      equipment_id: id,
      equipment_name: eq?.name || "",
      equipment_serial: eq?.serial_number || "",
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(form);
      onOpenChange(false);
    } catch {
      // Quien guarda ya muestra el aviso de error; el diálogo queda abierto para reintentar.
    } finally {
      setSaving(false);
    }
  };

  const update = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Nuevo Ticket de Soporte</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="space-y-1.5">
            <Label className="text-xs">Equipo *</Label>
            <Select value={form.equipment_id} onValueChange={handleEquipmentChange}>
              <SelectTrigger><SelectValue placeholder="Selecciona tu equipo" /></SelectTrigger>
              <SelectContent>
                {myEquipment.map(eq => (
                  <SelectItem key={eq.id} value={eq.id}>{eq.name} — {eq.serial_number}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Título del problema *</Label>
            <Input value={form.title} onChange={e => update("title", e.target.value)} placeholder="Ej: Pantalla no enciende" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Descripción detallada *</Label>
            <Textarea value={form.description} onChange={e => update("description", e.target.value)} placeholder="Describe el fallo con el mayor detalle posible..." rows={3} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Categoría</Label>
              <Select value={form.category} onValueChange={v => update("category", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {categories.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Prioridad</Label>
              <Select value={form.priority} onValueChange={v => update("priority", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {priorities.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button
            onClick={handleSave}
            disabled={saving || !form.title || !form.description || !form.equipment_id}
            className="bg-orange-600 hover:bg-orange-700"
          >
            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Crear Ticket
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}