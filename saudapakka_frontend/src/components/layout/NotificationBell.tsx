"use client";

import { useState, useEffect, useRef } from "react";
import { Bell, Check, X } from "lucide-react";
import { notificationService, NotificationItem } from "@/services/notificationService";
import { useRouter } from "next/navigation";

export default function NotificationBell() {
    const [notifications, setNotifications] = useState<NotificationItem[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const router = useRouter();

    const fetchNotifications = async () => {
        try {
            const data = await notificationService.getNotifications();
            setNotifications(data);
        } catch (error) {
            console.error("Failed to fetch notifications", error);
        }
    };

    // Initial fetch only (no polling)
    useEffect(() => {
        fetchNotifications();
    }, []);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const unreadCount = notifications.filter(n => !n.is_read).length;

    const handleMarkAsRead = async (id: number, e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            await notificationService.markAsRead(id);
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
        } catch (error) {
            console.error("Failed to mark as read", error);
        }
    };

    const handleMarkAllRead = async () => {
        try {
            setLoading(true);
            await notificationService.markAllAsRead();
            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
        } catch (error) {
            console.error("Failed to mark all as read", error);
        } finally {
            setLoading(false);
        }
    };

    const handleClickNotification = async (notification: NotificationItem) => {
        if (!notification.is_read) {
            await notificationService.markAsRead(notification.id);
            setNotifications(prev => prev.map(n => n.id === notification.id ? { ...n, is_read: true } : n));
        }
        setIsOpen(false);
        if (notification.action_url) {
            router.push(notification.action_url);
        }
    };

    const formatTime = (dateString: string) => {
        try {
            const date = new Date(dateString);
            // Simple fallback if date-fns is not installed, though it's standard in Next.js stacks often
            const now = new Date();
            const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

            if (diffInSeconds < 60) return "Just now";
            if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
            if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
            return date.toLocaleDateString();
        } catch (e) {
            return "";
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-green/50"
            >
                <Bell className="w-6 h-6" />
                {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white animate-pulse" />
                )}
            </button>

            {isOpen && (
                <>
                    {/* Mobile Backdrop for closing */}
                    <div className="fixed inset-0 z-[90] sm:hidden" onClick={() => setIsOpen(false)} />

                    <div className="fixed left-4 right-4 top-[72px] sm:absolute sm:right-0 sm:top-full sm:mt-2 sm:left-auto sm:w-96 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden z-[100] animate-in slide-in-from-top-2 fade-in duration-200">
                        <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                            <h3 className="font-bold text-gray-900">Notifications</h3>
                            {unreadCount > 0 && (
                                <button
                                    onClick={handleMarkAllRead}
                                    disabled={loading}
                                    className="text-xs font-medium text-primary-green hover:text-dark-green transition-colors disabled:opacity-50"
                                >
                                    Mark all read
                                </button>
                            )}
                        </div>

                        <div className="max-h-[60vh] overflow-y-auto custom-scrollbar">
                            {notifications.length === 0 ? (
                                <div className="p-8 text-center text-gray-500">
                                    <Bell className="w-8 h-8 mx-auto mb-2 opacity-20" />
                                    <p className="text-sm">No notifications yet</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-gray-50">
                                    {notifications.map((notification) => (
                                        <div
                                            key={notification.id}
                                            onClick={() => handleClickNotification(notification)}
                                            className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer flex gap-3 ${!notification.is_read ? "bg-green-50/30" : ""
                                                }`}
                                        >
                                            <div className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${!notification.is_read ? 'bg-primary-green' : 'bg-gray-200'}`} />
                                            <div className="flex-1 min-w-0">
                                                <p className={`text-sm text-gray-900 mb-0.5 ${!notification.is_read ? 'font-semibold' : 'font-medium'}`}>
                                                    {notification.title}
                                                </p>
                                                <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
                                                    {notification.message}
                                                </p>
                                                <p className="text-[10px] text-gray-400 mt-2">
                                                    {formatTime(notification.created_at)}
                                                </p>
                                            </div>
                                            {!notification.is_read && (
                                                <button
                                                    onClick={(e) => handleMarkAsRead(notification.id, e)}
                                                    className="self-start text-gray-300 hover:text-primary-green p-1 transition-colors"
                                                    title="Mark as read"
                                                >
                                                    <Check className="w-3 h-3" />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
