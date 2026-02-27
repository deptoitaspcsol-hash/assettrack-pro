import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Bell, BellDot, Check, CheckCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

export default function NotificationBell({ userEmail }) {
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!userEmail) return;
    loadNotifications();
    const unsub = base44.entities.Notification.subscribe((event) => {
      if (event.type === "create" && event.data?.user_email === userEmail) {
        setNotifications(prev => [event.data, ...prev]);
      }
    });
    return unsub;
  }, [userEmail]);

  const loadNotifications = async () => {
    const data = await base44.entities.Notification.filter(
      { user_email: userEmail },
      "-created_date",
      20
    );
    setNotifications(data);
  };

  const unread = notifications.filter(n => !n.read).length;

  const markAsRead = async (notif) => {
    if (notif.read) return;
    await base44.entities.Notification.update(notif.id, { read: true });
    setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, read: true } : n));
  };

  const markAllRead = async () => {
    const unreadItems = notifications.filter(n => !n.read);
    await Promise.all(unreadItems.map(n => base44.entities.Notification.update(n.id, { read: true })));
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const typeIcons = {
    nuevo_ticket: "🎫",
    ticket_asignado: "👷",
    ticket_actualizado: "🔄",
    ticket_resuelto: "✅",
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-9 w-9">
          {unread > 0 ? (
            <>
              <BellDot className="w-5 h-5 text-slate-600" />
              <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center font-bold">
                {unread > 9 ? "9+" : unread}
              </span>
            </>
          ) : (
            <Bell className="w-5 h-5 text-slate-500" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0 shadow-xl">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h3 className="font-semibold text-sm text-slate-800">Notificaciones</h3>
          {unread > 0 && (
            <Button variant="ghost" size="sm" className="text-xs h-7 text-indigo-600 hover:text-indigo-700" onClick={markAllRead}>
              <CheckCheck className="w-3.5 h-3.5 mr-1" /> Marcar todas
            </Button>
          )}
        </div>
        <div className="max-h-80 overflow-y-auto divide-y divide-slate-50">
          {notifications.length === 0 ? (
            <div className="py-10 text-center text-sm text-slate-400">Sin notificaciones</div>
          ) : (
            notifications.map(n => (
              <div
                key={n.id}
                onClick={() => markAsRead(n)}
                className={cn(
                  "flex gap-3 px-4 py-3 cursor-pointer hover:bg-slate-50 transition-colors",
                  !n.read && "bg-indigo-50/60"
                )}
              >
                <span className="text-lg flex-shrink-0">{typeIcons[n.type] || "🔔"}</span>
                <div className="flex-1 min-w-0">
                  <p className={cn("text-xs font-medium text-slate-800 leading-snug", !n.read && "font-semibold")}>{n.title}</p>
                  <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{n.message}</p>
                  <p className="text-[10px] text-slate-400 mt-1">
                    {n.created_date ? format(new Date(n.created_date), "dd/MM HH:mm") : ""}
                  </p>
                </div>
                {!n.read && <div className="w-2 h-2 rounded-full bg-indigo-500 flex-shrink-0 mt-1.5" />}
              </div>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}