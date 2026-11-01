import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, Monitor, Calendar, User, Wrench } from "lucide-react";
import StatusBadge from "../shared/StatusBadge";
import { format } from "date-fns";
import { todayISO } from "@/lib/dates";

export default function TicketDetailDialog({ open, onOpenChange, ticket, isAdmin, technicians, onUpdate }) {
  const [techEmail, setTechEmail] = useState(ticket?.technician_email || "");
  const [status, setStatus] = useState(ticket?.status || "abierto");
  const [resolution, setResolution] = useState(ticket?.resolution_notes || "");
  const [saving, setSaving] = useState(false);

  React.useEffect(() => {
    if (ticket) {
      setTechEmail(ticket.technician_email || "");
      setStatus(ticket.status || "abierto");
      setResolution(ticket.resolution_notes || "");
    }
  }, [ticket]);

  if (!ticket) return null;

  const handleSave = async () => {
    setSaving(true);
    // "none" es el valor de "Sin asignar" en el selector; no debe guardarse como técnico.
    const assignedEmail = techEmail === "none" ? "" : techEmail;
    const selectedTech = technicians.find(t => t.email === assignedEmail);
    const updates = {
      status,
      resolution_notes: resolution,
      technician_email: assignedEmail,
      technician_name: assignedEmail ? (selectedTech?.full_name || assignedEmail) : "",
    };
    if (status === "resuelto" && !ticket.resolved_date) {
      updates.resolved_date = todayISO(); // fecha local, no UTC
    }
    try {
      await onUpdate(ticket.id, updates, ticket);
      onOpenChange(false);
    } catch {
      // Quien guarda ya muestra el aviso de error; el diálogo queda abierto para reintentar.
    } finally {
      setSaving(false);
    }
  };

  const priorityColors = {
    baja: "bg-slate-100 text-slate-600",
    media: "bg-blue-100 text-blue-700",
    alta: "bg-amber-100 text-amber-700",
    critica: "bg-red-100 text-red-700",
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base leading-snug pr-6">{ticket.title}</DialogTitle>
          <div className="flex flex-wrap gap-2 mt-2">
            <StatusBadge status={ticket.status} />
            <Badge className={priorityColors[ticket.priority]}>{ticket.priority}</Badge>
            <StatusBadge status={ticket.category} />
          </div>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Info */}
          <div className="rounded-xl bg-slate-50 p-4 space-y-2 text-sm">
            <div className="flex items-center gap-2 text-slate-600">
              <Monitor className="w-4 h-4 text-slate-400" />
              <span>{ticket.equipment_name} — <span className="font-mono text-xs">{ticket.equipment_serial}</span></span>
            </div>
            <div className="flex items-center gap-2 text-slate-600">
              <User className="w-4 h-4 text-slate-400" />
              <span>{ticket.requester_name || ticket.requester_email}</span>
            </div>
            <div className="flex items-center gap-2 text-slate-500 text-xs">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>{ticket.created_date ? format(new Date(ticket.created_date), "dd/MM/yyyy HH:mm") : "—"}</span>
            </div>
          </div>

          {/* Description */}
          <div>
            <Label className="text-xs text-slate-500 uppercase tracking-wide">Descripción</Label>
            <p className="text-sm text-slate-700 mt-1 leading-relaxed">{ticket.description}</p>
          </div>

          {/* Admin controls */}
          {isAdmin && (
            <>
              <div className="space-y-1.5">
                <Label className="text-xs">Asignar Técnico</Label>
                <Select value={techEmail} onValueChange={setTechEmail}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sin asignar" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sin asignar</SelectItem>
                    {technicians.map(t => (
                      <SelectItem key={t.id} value={t.email}>{t.full_name || t.email}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Estado</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="abierto">Abierto</SelectItem>
                    <SelectItem value="en_proceso">En Proceso</SelectItem>
                    <SelectItem value="resuelto">Resuelto</SelectItem>
                    <SelectItem value="cerrado">Cerrado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Notas de Resolución</Label>
                <Textarea
                  value={resolution}
                  onChange={e => setResolution(e.target.value)}
                  placeholder="Describe la solución aplicada..."
                  rows={3}
                />
              </div>
            </>
          )}

          {/* Resolution notes (read-only for users) */}
          {!isAdmin && ticket.resolution_notes && (
            <div>
              <Label className="text-xs text-slate-500 uppercase tracking-wide">Resolución</Label>
              <p className="text-sm text-slate-700 mt-1 leading-relaxed">{ticket.resolution_notes}</p>
            </div>
          )}

          {ticket.technician_name && (
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Wrench className="w-4 h-4 text-slate-400" />
              <span>Técnico: {ticket.technician_name}</span>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cerrar</Button>
          {isAdmin && (
            <Button onClick={handleSave} disabled={saving} className="bg-indigo-600 hover:bg-indigo-700">
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Guardar Cambios
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}