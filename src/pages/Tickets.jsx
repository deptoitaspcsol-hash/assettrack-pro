import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Search, Ticket } from "lucide-react";
import TicketFormDialog from "../components/tickets/TicketFormDialog";
import TicketDetailDialog from "../components/tickets/TicketDetailDialog";
import TicketCard from "../components/tickets/TicketCard";
import EmptyState from "../components/shared/EmptyState";
import { toast } from "sonner";

export default function Tickets() {
  const [currentUser, setCurrentUser] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [search, setSearch] = useState("");
  const [statusTab, setStatusTab] = useState("all");

  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setCurrentUser);
  }, []);

  const isAdmin = currentUser?.role === "admin";

  const { data: tickets = [] } = useQuery({
    queryKey: ["tickets"],
    queryFn: () => base44.entities.Ticket.list("-created_date"),
  });

  const { data: myEquipment = [] } = useQuery({
    queryKey: ["my-equipment-tickets", currentUser?.email],
    queryFn: () => base44.entities.Equipment.filter({ assigned_to_email: currentUser.email }),
    enabled: !!currentUser?.email && !isAdmin,
  });

  const { data: allEquipment = [] } = useQuery({
    queryKey: ["equipment"],
    queryFn: () => base44.entities.Equipment.filter({ status: "asignado" }),
    enabled: isAdmin,
  });

  const { data: users = [] } = useQuery({
    queryKey: ["users"],
    queryFn: () => base44.entities.User.list(),
    enabled: isAdmin,
  });

  const technicians = users.filter(u => u.is_technician);

  const handleCreateTicket = async (form) => {
    const ticket = await base44.entities.Ticket.create({
      ...form,
      requester_email: currentUser.email,
      requester_name: currentUser.full_name || currentUser.email,
      status: "abierto",
    });

    // Notify all admins and technicians
    const recipients = users.filter(u => u.role === "admin" || u.is_technician);
    await Promise.all(recipients.map(u =>
      base44.entities.Notification.create({
        user_email: u.email,
        title: "🎫 Nuevo Ticket de Soporte",
        message: `${currentUser.full_name || currentUser.email} reportó: ${form.title} — ${form.equipment_name}`,
        type: "nuevo_ticket",
        ticket_id: ticket.id,
        read: false,
      })
    ));

    // Send email to admins
    await Promise.all(recipients.map(u =>
      base44.integrations.Core.SendEmail({
        to: u.email,
        subject: `[Ticket #${ticket.id.slice(-6)}] Nuevo ticket: ${form.title}`,
        body: `
Se ha creado un nuevo ticket de soporte.

📋 Título: ${form.title}
🖥️ Equipo: ${form.equipment_name} (${form.equipment_serial})
👤 Reportado por: ${currentUser.full_name || currentUser.email}
📌 Prioridad: ${form.priority}
📂 Categoría: ${form.category}

Descripción:
${form.description}

Ingresa al sistema para gestionar este ticket.
        `.trim()
      })
    ));

    queryClient.invalidateQueries({ queryKey: ["tickets"] });
    toast.success("Ticket creado. Se notificó al equipo técnico.");
  };

  const handleUpdateTicket = async (id, updates, oldTicket) => {
    await base44.entities.Ticket.update(id, updates);

    // Notify requester of status change
    if (updates.status !== oldTicket.status) {
      const statusLabels = { en_proceso: "En Proceso", resuelto: "Resuelto", cerrado: "Cerrado" };
      if (statusLabels[updates.status]) {
        await base44.entities.Notification.create({
          user_email: oldTicket.requester_email,
          title: `Ticket ${statusLabels[updates.status]}`,
          message: `Tu ticket "${oldTicket.title}" fue marcado como ${statusLabels[updates.status].toLowerCase()}.`,
          type: "ticket_actualizado",
          ticket_id: id,
          read: false,
        });
      }
    }

    // Notify new technician if assigned
    if (updates.technician_email && updates.technician_email !== oldTicket.technician_email && updates.technician_email !== "none") {
      await base44.entities.Notification.create({
        user_email: updates.technician_email,
        title: "👷 Ticket asignado a ti",
        message: `Se te asignó el ticket: "${oldTicket.title}" — ${oldTicket.equipment_name}`,
        type: "ticket_asignado",
        ticket_id: id,
        read: false,
      });
      await base44.integrations.Core.SendEmail({
        to: updates.technician_email,
        subject: `[Ticket Asignado] ${oldTicket.title}`,
        body: `
Se te ha asignado un ticket de soporte.

📋 Título: ${oldTicket.title}
🖥️ Equipo: ${oldTicket.equipment_name} (${oldTicket.equipment_serial})
👤 Reportado por: ${oldTicket.requester_name}
📌 Prioridad: ${oldTicket.priority}

Descripción:
${oldTicket.description}

Ingresa al sistema para atender este ticket.
        `.trim()
      });
    }

    queryClient.invalidateQueries({ queryKey: ["tickets"] });
    toast.success("Ticket actualizado");
  };

  const visibleTickets = tickets.filter(t => {
    if (!isAdmin && t.requester_email !== currentUser?.email && t.technician_email !== currentUser?.email) return false;
    const matchSearch = !search ||
      t.title?.toLowerCase().includes(search.toLowerCase()) ||
      t.equipment_name?.toLowerCase().includes(search.toLowerCase());
    const matchTab = statusTab === "all" || t.status === statusTab;
    return matchSearch && matchTab;
  });

  const statusCounts = {
    all: tickets.filter(t => isAdmin || t.requester_email === currentUser?.email || t.technician_email === currentUser?.email).length,
    abierto: tickets.filter(t => t.status === "abierto" && (isAdmin || t.requester_email === currentUser?.email || t.technician_email === currentUser?.email)).length,
    en_proceso: tickets.filter(t => t.status === "en_proceso" && (isAdmin || t.requester_email === currentUser?.email || t.technician_email === currentUser?.email)).length,
    resuelto: tickets.filter(t => t.status === "resuelto" && (isAdmin || t.requester_email === currentUser?.email || t.technician_email === currentUser?.email)).length,
  };

  const equipmentForForm = isAdmin ? allEquipment : myEquipment;

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Tickets de Soporte</h1>
          <p className="text-sm text-slate-500 mt-0.5">{isAdmin ? "Gestión de solicitudes de soporte técnico" : "Tus solicitudes de soporte"}</p>
        </div>
        {!isAdmin && equipmentForForm.length > 0 && (
          <Button onClick={() => setFormOpen(true)} className="bg-orange-600 hover:bg-orange-700">
            <Plus className="w-4 h-4 mr-2" /> Nuevo Ticket
          </Button>
        )}
        {isAdmin && (
          <Button onClick={() => setFormOpen(true)} className="bg-orange-600 hover:bg-orange-700">
            <Plus className="w-4 h-4 mr-2" /> Crear Ticket
          </Button>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <Tabs value={statusTab} onValueChange={setStatusTab} className="w-full sm:w-auto">
          <TabsList className="bg-slate-100">
            <TabsTrigger value="all">Todos <span className="ml-1.5 text-xs opacity-60">{statusCounts.all}</span></TabsTrigger>
            <TabsTrigger value="abierto">Abierto <span className="ml-1.5 text-xs opacity-60">{statusCounts.abierto}</span></TabsTrigger>
            <TabsTrigger value="en_proceso">En Proceso <span className="ml-1.5 text-xs opacity-60">{statusCounts.en_proceso}</span></TabsTrigger>
            <TabsTrigger value="resuelto">Resuelto <span className="ml-1.5 text-xs opacity-60">{statusCounts.resuelto}</span></TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input placeholder="Buscar ticket..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
      </div>

      {visibleTickets.length === 0 ? (
        <Card>
          <EmptyState icon={Ticket} title="Sin tickets" description="No hay tickets de soporte registrados" />
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {visibleTickets.map(t => (
            <TicketCard
              key={t.id}
              ticket={t}
              onClick={() => { setSelectedTicket(t); setDetailOpen(true); }}
            />
          ))}
        </div>
      )}

      <TicketFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        myEquipment={equipmentForForm}
        onSave={handleCreateTicket}
      />

      {selectedTicket && (
        <TicketDetailDialog
          open={detailOpen}
          onOpenChange={setDetailOpen}
          ticket={selectedTicket}
          isAdmin={isAdmin}
          technicians={users}
          onUpdate={handleUpdateTicket}
        />
      )}
    </div>
  );
}