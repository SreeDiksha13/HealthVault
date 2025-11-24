"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Home, FileText, MapPin, User } from "lucide-react";
import React from "react";
import api from "@/lib/api"; // ✅ Important import

interface UserData {
  _id: string;
  usertype: "patient" | "doctor";
}

export default function Footer() {
  const [user, setUser] = useState<UserData | null>(null);

  useEffect(() => {
    const loadUser = async () => {
      const storedUser = localStorage.getItem("hv_user");
      if (!storedUser) return;

      try {
        const parsed = JSON.parse(storedUser);

        // ✅ If doctor → we already know their ID
        if (parsed.role === "doctor") {
          setUser({ _id: parsed._id, usertype: "doctor" });
          return;
        }

        // ✅ If patient → fetch by email to retrieve correct patient _id
        const res = await api.get("/api/patients", { params: { email: parsed.email } });
        setUser({ _id: res.data._id, usertype: "patient" });
      } catch (err) {
        console.error("Footer user load error:", err);
      }
    };

    loadUser();
  }, []);

  // ✅ Avoid rendering until user data is ready
  if (!user) return null;

  const links =
    user.usertype === "doctor"
      ? [
          { href: "/doctor-dashboard", icon: <Home />, label: "Dashboard" },
          { href: "/doctor-appointments", icon: <FileText />, label: "Appointments" },
          { href: "/hospitals", icon: <MapPin />, label: "Hospitals" },
          { href: "/profile", icon: <User />, label: "Profile" },
        ]
      : [
          { href: "/patient-dashboard", icon: <Home />, label: "Dashboard" },
          // ✅ Patient ID is now always correct
          { href: `/patient-records/${user._id}`, icon: <FileText />, label: "Records" },
          { href: "/hospitals", icon: <MapPin />, label: "Hospitals" },
          { href: "/profile", icon: <User />, label: "Profile" },
        ];

  return (
    <footer className="h-[50px] fixed bottom-0 left-0 right-0 bg-gradient-to-r from-teal-500 to-cyan-600 px-6 py-4 shadow-2xl border-t border-teal-400 z-50">
      <div className="flex justify-around items-center max-w-md mx-auto">
        {links.map((link) => (
          <Link key={link.label} href={link.href} className="flex flex-col items-center space-y-1 group">
            {React.cloneElement(link.icon, {
              className: "w-6 h-6 text-gray-400 group-hover:text-white transition-colors",
            })}
            <span className="text-xs text-gray-400 group-hover:text-white transition-colors">{link.label}</span>
          </Link>
        ))}
      </div>
    </footer>
  );
}
