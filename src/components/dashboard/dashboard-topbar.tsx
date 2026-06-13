/**
 * Dashboard Topbar Component
 * Displays search bar, notifications, and user greeting.
 */

"use client";

import { Search, Bell, User } from "lucide-react";
import { useState } from "react";

interface DashboardTopbarProps {
  userName?: string;
  onSearch?: (query: string) => void;
}

export function DashboardTopbar({ userName = "Eduardo", onSearch }: DashboardTopbarProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    onSearch?.(value);
  };

  return (
    <div
      className="h-20 flex items-center justify-between px-8 border-b"
      style={{
        backgroundColor: "#FFFFFF",
        borderColor: "rgba(128, 0, 32, 0.1)",
      }}
    >
      {/* Search bar */}
      <div className="flex-1 max-w-2xl">
        <div
          className="flex items-center gap-3 px-4 py-2.5 rounded-lg border"
          style={{
            backgroundColor: "#F5F5F5",
            borderColor: "rgba(128, 0, 32, 0.15)",
          }}
        >
          <Search size={18} className="text-gray-400" />
          <input
            type="text"
            placeholder="Buscar becas, instituciones..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="flex-1 bg-transparent outline-none text-sm text-gray-900 placeholder-gray-500"
            aria-label="Search scholarships"
          />
        </div>
      </div>

      {/* Right section */}
      <div className="flex items-center gap-6 ml-8">
        {/* Notification icon */}
        <button
          className="relative p-2 rounded-lg transition-colors hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#800020]"
          aria-label="Notifications"
          title="You have 0 new notifications"
        >
          <Bell size={20} className="text-gray-600" />
          {/* Notification badge (example: hidden for now) */}
          {/* <span className="absolute top-1 right-1 w-2 h-2 rounded-full" style={{ backgroundColor: "#800020" }}></span> */}
        </button>

        {/* Divider */}
        <div
          className="w-px h-6"
          style={{ backgroundColor: "rgba(128, 0, 32, 0.2)" }}
        ></div>

        {/* User section */}
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-sm font-semibold text-gray-900">Hola, {userName}</p>
            <p className="text-xs text-gray-500">Bienvenido</p>
          </div>

          {/* Avatar - simple circle */}
          <button
            className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold transition-opacity hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#004451]"
            style={{
              backgroundColor: "#004451",
            }}
            aria-label="User profile"
            title="Profile settings"
          >
            <User size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
