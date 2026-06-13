/**
 * Dashboard Sidebar Component
 * Navigation sidebar with logo, menu items, and settings.
 */

"use client";

import { useState } from "react";
import { BecaHubLogo } from "@/components/brand/becahub-logo";
import {
  Home,
  Star,
  Bookmark,
  Calendar,
  BarChart3,
  Settings,
  ChevronRight,
} from "lucide-react";

interface SidebarItemProps {
  icon: React.ReactNode;
  label: string;
  href: string;
  active?: boolean;
  onClick?: () => void;
}

function SidebarItem({ icon, label, active = false, onClick }: SidebarItemProps) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors relative group text-left"
      style={{
        backgroundColor: active ? "rgba(128, 0, 32, 0.08)" : "transparent",
        color: active ? "#800020" : "#666",
      }}
      aria-current={active ? "page" : undefined}
    >
      {/* Left accent line when active */}
      {active && (
        <div
          className="absolute left-0 top-0 bottom-0 w-1 rounded-r"
          style={{ backgroundColor: "#800020" }}
        ></div>
      )}

      {/* Icon */}
      <span className="flex-shrink-0">{icon}</span>

      {/* Label */}
      <span className="flex-1 font-medium text-sm">{label}</span>

      {/* Chevron on hover */}
      {active && (
        <ChevronRight size={16} className="flex-shrink-0" style={{ color: "#800020" }} />
      )}
    </button>
  );
}

interface DashboardSidebarProps {
  currentPath?: string;
  onNavigate?: (path: string) => void;
}

export function DashboardSidebar({ currentPath = "/dashboard", onNavigate }: DashboardSidebarProps) {
  const [activeItem, setActiveItem] = useState(currentPath);

  const menuItems = [
    { icon: <Home size={20} />, label: "Inicio", href: "/dashboard" },
    { icon: <Star size={20} />, label: "Recomendadas", href: "/dashboard/recommended" },
    { icon: <Bookmark size={20} />, label: "Guardadas", href: "/dashboard/saved" },
    { icon: <Calendar size={20} />, label: "Fechas", href: "/dashboard/dates" },
    { icon: <BarChart3 size={20} />, label: "Actividad", href: "/dashboard/activity" },
  ];

  const handleItemClick = (href: string) => {
    setActiveItem(href);
    onNavigate?.(href);
    // TODO(auth): Implement navigation
    console.log(`Navegando a ${href}`);
  };

  return (
    <div
      className="w-64 h-screen flex flex-col border-r overflow-y-auto"
      style={{
        backgroundColor: "#FFFFFF",
        borderColor: "rgba(128, 0, 32, 0.1)",
      }}
    >
      {/* Logo section */}
      <div className="p-6 border-b" style={{ borderColor: "rgba(128, 0, 32, 0.1)" }}>
        <div className="mb-4">
          <BecaHubLogo variant="mark" className="w-12 h-12" />
        </div>
        <h1 className="text-xl font-bold text-gray-900">BecaHub</h1>
        <p className="text-xs text-gray-500 mt-1">Portal de Becas Premium</p>
      </div>

      {/* Navigation items */}
      <nav className="flex-1 px-4 py-6 space-y-2">
        {menuItems.map((item) => (
          <SidebarItem
            key={item.href}
            icon={item.icon}
            label={item.label}
            href={item.href}
            active={activeItem === item.href}
            onClick={() => handleItemClick(item.href)}
          />
        ))}
      </nav>

      {/* Settings section */}
      <div className="border-t p-4" style={{ borderColor: "rgba(128, 0, 32, 0.1)" }}>
        <button
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-left text-gray-600 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#800020]"
          onClick={() => {
            // TODO(auth): Navigate to settings
            console.log("Abriendo configuración");
          }}
          aria-label="Settings"
        >
          <Settings size={20} />
          <span className="font-medium text-sm">Configuración</span>
        </button>
      </div>
    </div>
  );
}
