// pages/dashboard.js
import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  FileTextIcon,
  PenSquareIcon,
  ClipboardListIcon,
  UsersIcon,
  HistoryIcon,
  UserCogIcon,
  NotebookTextIcon,
} from "lucide-react";
import { API_BASE_URL } from "../utils/config";

async function fetchProfile() {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("pies-token") : null;
  if (!token) return null;
  const res = await fetch(`${API_BASE_URL}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return null;
  return res.json();
}

export default function Dashboard() {
  const [firstName, setFirstName] = useState("");
  const [role, setRole] = useState("");

  useEffect(() => {
    setRole(localStorage.getItem("pies-role") || "");
    (async () => {
      const me = await fetchProfile();
      if (me?.firstName) setFirstName(me.firstName);
      else {
        try {
          const token = localStorage.getItem("pies-token");
          const sub = token ? JSON.parse(atob(token.split(".")[1]))?.sub : "";
          setFirstName(sub || "Therapist");
        } catch {
          setFirstName("Therapist");
        }
      }
    })();
  }, []);

  const ACTIONS = [
    { href: "/intake", label: "Intake Form", icon: FileTextIcon },
    { href: "/soap", label: "SOAP Note", icon: PenSquareIcon },
    { href: "/self-assessment", label: "Self Assessment", icon: ClipboardListIcon },
    { href: "/clients/assigned", label: "Assigned Clients", icon: UsersIcon },
    { href: "/clients/history", label: "Session History", icon: HistoryIcon },
    role === "Senior Therapist" || role === "Admin"
      ? { href: "/clients/all", label: "View All Clients", icon: UsersIcon }
      : null,
    role === "Senior Therapist" || role === "Admin"
      ? { href: "/notes", label: "View Therapist Notes", icon: NotebookTextIcon }
      : null,
    role === "Admin"
      ? { href: "/therapists/manage", label: "Manage Therapists", icon: UserCogIcon }
      : null,
  ].filter(Boolean);

  const bannerImages = [
    { src: "/images/dashboard/pies1.jpg", alt: "Meditation outdoors" },
    { src: "/images/dashboard/pies3.jpg", alt: "Tree pose with banner" },
    { src: "/images/dashboard/pies4.jpg", alt: "Studio joy" },
    { src: "/images/dashboard/pies5.jpg", alt: "Warrior pose in park" },
    { src: "/images/dashboard/pies6.jpg", alt: "Restorative setup" },
  ];

  const EDGE = 22; // overlap + fade width

  return (
    <div className="max-w-7xl mx-auto px-4 py-10 space-y-12">
      {/* Hero with multi-image background */}
      <section className="relative rounded-2xl overflow-hidden shadow-xl h-56 md:h-72 lg:h-80">
        {/* Image strip (under overlays) */}
        <div className="absolute inset-0 flex z-10">
          {bannerImages.map(({ src, alt }, i) => (
            <div
              key={src}
              className="relative flex-1"
              style={{
                marginLeft: i === 0 ? 0 : `-${EDGE}px`,
                zIndex: 10 + i,
              }}
            >
              <Image
                src={src}
                alt={alt}
                fill
                priority={i === 0}
                className="object-cover"
                sizes="(max-width: 1024px) 20vw, 20vw"
                style={{
                  WebkitMaskImage:
                    i === 0
                      ? "none"
                      : `linear-gradient(to right, rgba(0,0,0,0) 0, rgba(0,0,0,1) ${EDGE}px, rgba(0,0,0,1) 100%)`,
                  maskImage:
                    i === 0
                      ? "none"
                      : `linear-gradient(to right, rgba(0,0,0,0) 0, rgba(0,0,0,1) ${EDGE}px, rgba(0,0,0,1) 100%)`,
                  transform: "translateZ(0)",
                }}
              />
            </div>
          ))}
        </div>

        {/* Overlays (above images, below text) */}
        <div className="pointer-events-none absolute inset-0 bg-black/25 z-40" />
        <div className="pointer-events-none absolute inset-0 z-40 bg-gradient-to-r from-brandLavender/95 via-brandLavender/80 to-brandLavender/50" />

        {/* Text (topmost) */}
        <div className="relative z-50 h-full flex flex-col justify-center p-8 md:p-12 text-white">
          <h1 className="text-3xl md:text-4xl font-bold drop-shadow-sm">
            Welcome{firstName ? `, ${firstName}!` : "!"}
          </h1>
          <p className="mt-2 text-base md:text-lg opacity-95">
            Breathe in. Grow. Support your clients—start by choosing an action below.
          </p>
        </div>
      </section>

      {/* Quick actions */}
      <section>
        <h2 className="sr-only">Quick Actions</h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {ACTIONS.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="group relative bg-white rounded-xl p-6 shadow-md hover:shadow-xl transition transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brandLavender"
            >
              <div className="flex items-center space-x-4">
                <div className="p-3 rounded-lg bg-gradient-to-br from-brandLavender/90 to-purple-300 text-white shadow">
                  <Icon size={24} />
                </div>
                <span className="font-semibold text-gray-800 group-hover:text-brandLavender">
                  {label}
                </span>
              </div>
              <span className="pointer-events-none absolute inset-0 rounded-xl bg-gradient-to-br from-brandLavender/0 via-brandLavender/0 to-brandLavender/10 opacity-0 group-hover:opacity-100 transition" />
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
