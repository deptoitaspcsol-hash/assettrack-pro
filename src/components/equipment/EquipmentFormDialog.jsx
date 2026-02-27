import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";

const types = [
  { value: "laptop", label: "Laptop" },
  { value: "desktop", label: "Desktop" },
  { value: "monitor", label: "Monitor" },
  { value: "teclado", label: "Teclado" },
  { value: "mouse", label: "Mouse" },
  { value: "impresora", label: "Impresora" },
  { value: "telefono", label: "Teléfono" },
  { value: "tablet", label: "Tablet" },
  { value: "proyector", label: "Proyector" },
  { value: "otro", label: "Otro" },
];

const conditions = [
  { value: "nuevo", label: "Nuevo" },
  { value: "bueno", label: "Bueno" },
  { value: "regular", label: "Regular" },
  { value: "malo", label: "Malo" },
];

const defaultForm = {
  name: "", type: "laptop", brand: "", model: "", serial_number: "",
  asset_tag: "", condition: "bueno", purchase_date: "", notes: ""
};

export default function EquipmentFormDialog({ open, onOpenChange, equipment, onSave }) {
  const [form, setForm] = useState(defaultForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (equipment) {
      setForm({ ...defaultForm, ...equipment });
    } else {
      setForm(defaultForm);
    }
  }, [equipment, open]);

  const handleSave = async () => {
    setSaving(true);
    await onSave(form);
    setSaving(false);
    onOpenChange(false);
  };

  const update = (key, value) => setForm(prev => ({ ...prev, [key]: value }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg">{equipment ? "Editar Equipo" : "Nuevo Equipo"}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Nombre *</Label>
              <Input value={form.name} onChange={e => update("name", e.target.value)} placeholder="Ej: Laptop Dell IT-001" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Tipo *</Label>
              <Select value={form.type} onValueChange={v => update("type", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {types.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Marca</Label>
              <Input value={form.brand} onChange={e => update("brand", e.target.value)} placeholder="Dell, HP, Lenovo..." />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Modelo</Label>
              <Input value={form.model} onChange={e => update("model", e.target.value)} placeholder="Latitude 5520..." />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">No. Serie *</Label>
              <Input value={form.serial_number} onChange={e => update("serial_number", e.target.value)} placeholder="SN-XXXXXXXX" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Etiqueta Activo</Label>
              <Input value={form.asset_tag} onChange={e => update("asset_tag", e.target.value)} placeholder="ACT-0001" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Condición</Label>
              <Select value={form.condition} onValueChange={v => update("condition", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {conditions.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Fecha de Compra</Label>
              <Input type="date" value={form.purchase_date} onChange={e => update("purchase_date", e.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Notas</Label>
            <Textarea value={form.notes} onChange={e => update("notes", e.target.value)} placeholder="Observaciones..." rows={2} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSave} disabled={saving || !form.name || !form.serial_number} className="bg-indigo-600 hover:bg-indigo-700">
            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {equipment ? "Actualizar" : "Registrar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}