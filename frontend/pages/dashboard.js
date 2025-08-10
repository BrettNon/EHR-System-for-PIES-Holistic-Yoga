// pages/dashboard.js
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  FileTextIcon,
  PenSquareIcon,
  ClipboardListIcon,
  UsersIcon,
  HistoryIcon,
  UserCogIcon,
  NotebookTextIcon,
} from "lucide-react";

/** Fetch first name using /auth/me (token already stored on login) */
async function fetchProfile() {
  const token = typeof window !== "undefined" ? localStorage.getItem("pies-token") : null;
  if (!token) return null;
  const res = await fetch("http://localhost:8080/auth/me", {
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
        // fallback to username claim in JWT if first name missing
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

  // Remove unwanted links and show Sr/Admin only items if role allows
  const ACTIONS = [
    { href: "/intake", label: "Intake Form", icon: FileTextIcon },
    { href: "/soap", label: "SOAP Note", icon: PenSquareIcon },
    { href: "/self-assessment", label: "Self Assessment", icon: ClipboardListIcon },
    { href: "/clients/assigned", label: "Assigned Clients", icon: UsersIcon },
    { href: "/clients/history", label: "Session History", icon: HistoryIcon },
    // senior / admin only
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

  return (
    <div className="max-w-7xl mx-auto px-4 py-10 space-y-10">
      {/* Hero / Welcome banner */}
      <section className="rounded-2xl shadow-xl overflow-hidden bg-gradient-to-br from-brandLavender via-purple-500 to-purple-300 text-white p-8 md:p-12 relative">
        <div className="relative z-10">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">
            Welcome{firstName ? `, ${firstName}!` : "!"}
          </h1>
          <p className="text-lg opacity-90">
            Here’s what you can do today. Choose an action to get started.
          </p>
        </div>
        {/* Decorative circles */}
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
        <div className="absolute bottom-0 left-10 w-24 h-24 bg-white/10 rounded-full blur-xl" />
      </section>

      {/* Quick actions grid */}
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
              {/* subtle gradient corner highlight */}
              <span className="pointer-events-none absolute inset-0 rounded-xl bg-gradient-to-br from-brandLavender/0 via-brandLavender/0 to-brandLavender/10 opacity-0 group-hover:opacity-100 transition" />
            </Link>
          ))}
        </div>
      </section>

      {/* (Optional) future: stats / recent activity blocks */}
      {/* <section className="grid gap-6 md:grid-cols-2">
        <StatsCard title="Active Clients" value="23" />
        <StatsCard title="Sessions This Week" value="14" />
      </section> */}
    </div>
  );
}

/* Example stat card component if you add metrics later
function StatsCard({ title, value }) {
  return (
    <div className="bg-white rounded-xl p-6 shadow-md">
      <p className="text-sm text-gray-500">{title}</p>
      <p className="text-3xl font-bold text-gray-800 mt-1">{value}</p>
    </div>
  );
}
*/
