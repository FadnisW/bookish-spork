"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { markNotificationRead, markAllNotificationsRead } from "@/lib/actions";

// ─── Types ────────────────────────────────────────────────────────────────────
export type NotificationItem = {
  id: number;
  title: string;
  description: string | null;
  type: "ANNOUNCEMENT" | "EVENT" | "EXAM" | "ASSIGNMENT" | "RESULT";
  createdAt: Date;
  isRead: boolean;
};

type NotificationBellProps = {
  notifications: NotificationItem[];
  unreadCount: number;
  userId: string;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const TYPE_CONFIG: Record<
  NotificationItem["type"],
  { color: string; bg: string; icon: string; label: string }
> = {
  ANNOUNCEMENT: { color: "border-purple-500", bg: "bg-purple-50", icon: "📢", label: "Announcement" },
  EVENT:        { color: "border-blue-500",   bg: "bg-blue-50",   icon: "📅", label: "Event" },
  EXAM:         { color: "border-orange-500", bg: "bg-orange-50", icon: "📝", label: "Exam" },
  ASSIGNMENT:   { color: "border-green-500",  bg: "bg-green-50",  icon: "📋", label: "Assignment" },
  RESULT:       { color: "border-teal-500",   bg: "bg-teal-50",   icon: "🏆", label: "Result" },
};

const timeAgo = (date: Date): string => {
  const d = date instanceof Date ? date : new Date(date);
  const secs = Math.floor((Date.now() - d.getTime()) / 1000);
  if (secs < 60) return "just now";
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
};

// ─── Component ────────────────────────────────────────────────────────────────
export default function NotificationBell({
  notifications: initialNotifications,
  unreadCount: initialUnread,
  userId,
}: NotificationBellProps) {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState(initialNotifications);
  const [unreadCount, setUnreadCount] = useState(initialUnread);
  const [isPending, startTransition] = useTransition();

  const handleMarkRead = (id: number) => {
    // Optimistic update
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
    // Sync with DB
    startTransition(async () => {
      await markNotificationRead(id, userId);
    });
  };

  const handleMarkAllRead = () => {
    const unreadIds = notifications.filter((n) => !n.isRead).map((n) => n.id);
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
    startTransition(async () => {
      await markAllNotificationsRead(userId, "", unreadIds);
    });
  };

  return (
    <>
      {/* ── Bell Button ──────────────────────────────────────────────────── */}
      <div
        className="bg-white rounded-full w-7 h-7 flex items-center justify-center cursor-pointer relative"
        onClick={() => setOpen(true)}
        title="Notifications"
      >
        <Image src="/announcement.png" alt="notifications" width={20} height={20} />
        {unreadCount > 0 && (
          <div className="absolute -top-3 left-4 min-w-[20px] h-5 flex items-center justify-center bg-purple-500 text-white rounded-full text-xs px-1 font-semibold tabular-nums">
            {unreadCount > 99 ? "99+" : unreadCount}
          </div>
        )}
      </div>

      {/* ── Backdrop ─────────────────────────────────────────────────────── */}
      {open && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-[1px] z-40"
          onClick={() => setOpen(false)}
        />
      )}

      {/* ── Curtain Panel ────────────────────────────────────────────────── */}
      <div
        className={`fixed top-0 right-0 h-screen w-80 bg-white/95 backdrop-blur-lg shadow-2xl z-50 flex flex-col
          transition-transform duration-300 ease-in-out
          ${open ? "translate-x-0" : "translate-x-full"}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <h2 className="font-semibold text-gray-800 text-base">Notifications</h2>
            {unreadCount > 0 && (
              <span className="bg-purple-100 text-purple-700 text-xs font-semibold px-2 py-0.5 rounded-full">
                {unreadCount} new
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                disabled={isPending}
                className="text-xs text-purple-600 hover:text-purple-800 font-medium transition-colors disabled:opacity-50"
              >
                Mark all read
              </button>
            )}
            <button
              onClick={() => setOpen(false)}
              className="text-gray-400 hover:text-gray-700 transition-colors w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Notification List */}
        <div className="flex-1 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-center px-6">
              <div className="text-5xl">🎉</div>
              <p className="text-gray-500 font-medium">You&apos;re all caught up!</p>
              <p className="text-gray-400 text-xs">No new notifications right now.</p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-50">
              {notifications.map((n) => {
                const cfg = TYPE_CONFIG[n.type];
                return (
                  <li
                    key={n.id}
                    onClick={() => !n.isRead && handleMarkRead(n.id)}
                    className={`relative group flex gap-3 p-4 border-l-4 ${cfg.color}
                      ${!n.isRead ? `${cfg.bg} cursor-pointer hover:brightness-95` : "bg-white opacity-70"}
                      transition-all duration-200`}
                  >
                    <span className="text-xl mt-0.5 flex-shrink-0">{cfg.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-1">
                        <p className={`text-sm leading-snug ${!n.isRead ? "font-semibold text-gray-800" : "font-normal text-gray-600"} line-clamp-2`}>
                          {n.title}
                        </p>
                        {!n.isRead && (
                          <span className="flex-shrink-0 w-2 h-2 rounded-full bg-purple-500 mt-1" />
                        )}
                      </div>
                      <span className="text-[10px] text-gray-400 mt-1 block">{timeAgo(n.createdAt)}</span>
                    </div>

                    {/* ── Hover Tooltip (Left Side) ────────────────────── */}
                    {n.description && (
                      <div className="absolute right-full top-2 z-[60] mr-3 pointer-events-none
                        opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0
                        transition-all duration-300 ease-out origin-right w-64">
                        <div className="bg-white border border-gray-100 text-gray-800 text-xs
                          rounded-xl p-3 shadow-[0_8px_30px_rgb(0,0,0,0.12)] leading-relaxed relative
                          before:content-[''] before:absolute before:top-4 before:-right-1.5 before:w-3 before:h-3
                          before:bg-white before:rotate-45 before:border-r before:border-t before:border-gray-100">
                          {n.description.length > 80 ? n.description.slice(0, 80) + "…" : n.description}
                        </div>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-gray-100 text-center">
          <p className="text-[10px] text-gray-400">
            Showing {notifications.length} recent notifications
          </p>
        </div>
      </div>
    </>
  );
}
