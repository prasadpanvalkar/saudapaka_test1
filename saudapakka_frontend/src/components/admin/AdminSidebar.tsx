"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    UsersIcon,
    HomeModernIcon,
    ChartPieIcon,
    DocumentCheckIcon,
    ArrowLeftOnRectangleIcon,
    HomeIcon
} from "@heroicons/react/24/outline";
import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";

export default function AdminSidebar() {
    const pathname = usePathname();
    const { user, logout } = useAuth();
    const router = useRouter();

    const handleLogout = () => {
        logout();
        router.push("/login");
    };

    const navigation = [
        { name: "Overview", href: "/admin", icon: ChartPieIcon },
        { name: "User Management", href: "/admin/users", icon: UsersIcon },
        { name: "Properties", href: "/admin/properties", icon: HomeModernIcon },
        { name: "Mandate Requests", href: "/admin/mandates", icon: DocumentCheckIcon },
        { name: "My Profile", href: "/admin/profile", icon: UsersIcon },
        { name: "Home Website", href: "/", icon: HomeIcon },
    ];

    return (
        <aside className="w-72 bg-dark-green text-white p-6 flex flex-col fixed h-full shadow-2xl z-20">
            <div className="mb-10 px-2 flex items-center gap-3">
                <div className="p-2 bg-white/10 rounded-lg">
                    <UsersIcon className="w-6 h-6 text-white" />
                </div>
                <div>
                    <h2 className="text-xl font-bold tracking-tight">Admin<span className="text-accent-green">Portal</span></h2>
                    <p className="text-xs text-white/50 uppercase tracking-widest">Saudapakka</p>
                </div>
            </div>

            <nav className="flex-1 space-y-1">
                {navigation.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${isActive
                                ? "bg-primary-green text-white shadow-lg shadow-black/20"
                                : "text-gray-400 hover:bg-white/10 hover:text-white"
                                }`}
                        >
                            <item.icon className={`w-5 h-5 transition-colors ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-white'}`} />
                            <span className="font-medium">{item.name}</span>
                        </Link>
                    );
                })}
            </nav>

            <div className="pt-6 border-t border-white/10">
                <div className="flex items-center gap-3 mb-6 px-2">
                    <div className="w-10 h-10 rounded-full bg-accent-green flex items-center justify-center text-dark-green font-bold">
                        {user?.full_name?.[0] || "A"}
                    </div>
                    <div>
                        <div className="text-sm font-semibold text-white">{user?.full_name || "Admin"}</div>
                        <div className="text-xs text-gray-400">Administrator</div>
                    </div>
                </div>
                <button
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center gap-2 bg-white/10 hover:bg-red-500/20 hover:text-red-400 text-gray-300 py-3 rounded-xl transition-all"
                >
                    <ArrowLeftOnRectangleIcon className="w-5 h-5" /> Logout
                </button>
            </div>
        </aside>
    );
}
