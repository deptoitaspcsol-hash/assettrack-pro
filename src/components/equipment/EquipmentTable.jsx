import React from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Pencil, UserPlus, RotateCcw, Trash2, Laptop, Monitor, Printer, Smartphone, Tablet, Mouse, Keyboard, Video, HardDrive } from "lucide-react";
import StatusBadge from "../shared/StatusBadge";
import EmptyState from "../shared/EmptyState";

const typeIcons = {
  laptop: Laptop, desktop: HardDrive, monitor: Monitor, teclado: Keyboard,
  mouse: Mouse, impresora: Printer, telefono: Smartphone, tablet: Tablet,
  proyector: Video, otro: HardDrive,
};

export default function EquipmentTable({ equipment, isAdmin, onEdit, onAssign, onReturn, onDelete }) {
  if (!equipment?.length) {
    return <EmptyState title="Sin equipos" description="No hay equipos registrados aún" />;
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="bg-slate-50/80">
            <TableHead className="text-xs font-semibold text-slate-500">Equipo</TableHead>
            <TableHead className="text-xs font-semibold text-slate-500">Serie / Etiqueta</TableHead>
            <TableHead className="text-xs font-semibold text-slate-500">Estado</TableHead>
            <TableHead className="text-xs font-semibold text-slate-500">Condición</TableHead>
            <TableHead className="text-xs font-semibold text-slate-500">Asignado a</TableHead>
            {isAdmin && <TableHead className="text-xs font-semibold text-slate-500 w-12"></TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {equipment.map(eq => {
            const Icon = typeIcons[eq.type] || HardDrive;
            return (
              <TableRow key={eq.id} className="hover:bg-slate-50/50 transition-colors">
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-indigo-50">
                      <Icon className="w-4 h-4 text-indigo-600" />
                    </div>
                    <div>
                      <p className="font-medium text-sm text-slate-800">{eq.name}</p>
                      <p className="text-xs text-slate-400">{eq.brand} {eq.model}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <p className="text-sm font-mono text-slate-600">{eq.serial_number}</p>
                  {eq.asset_tag && <p className="text-xs text-slate-400">{eq.asset_tag}</p>}
                </TableCell>
                <TableCell><StatusBadge status={eq.status} /></TableCell>
                <TableCell><StatusBadge status={eq.condition} /></TableCell>
                <TableCell>
                  <p className="text-sm text-slate-600">{eq.assigned_to_name || "—"}</p>
                </TableCell>
                {isAdmin && (
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onEdit(eq)}>
                          <Pencil className="w-3.5 h-3.5 mr-2" /> Editar
                        </DropdownMenuItem>
                        {eq.status === "disponible" && (
                          <DropdownMenuItem onClick={() => onAssign(eq)}>
                            <UserPlus className="w-3.5 h-3.5 mr-2" /> Asignar
                          </DropdownMenuItem>
                        )}
                        {eq.status === "asignado" && (
                          <DropdownMenuItem onClick={() => onReturn(eq)}>
                            <RotateCcw className="w-3.5 h-3.5 mr-2" /> Devolver
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={() => onDelete(eq)} className="text-red-600">
                          <Trash2 className="w-3.5 h-3.5 mr-2" /> Eliminar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                )}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}