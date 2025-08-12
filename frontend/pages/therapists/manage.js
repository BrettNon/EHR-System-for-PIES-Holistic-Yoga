// pages/therapists/manage.js
import { useEffect, useState } from "react";
import Link from "next/link";
import { SearchIcon, Trash2Icon } from "lucide-react";
import { API_BASE_URL } from "../../utils/config";

const ROLE_LABELS = {
  ADMIN: "Admin",
  SENIOR: "Senior Therapist",
  JUNIOR: "Therapist",
};

export default function ManageTherapistsPage() {
  const [therapists, setTherapists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  const token =
    typeof window !== "undefined" ? localStorage.getItem("pies-token") : null;

  /* ───────────────── fetch therapists ───────────────── */
  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        // This endpoint requires ADMIN or SENIOR (per your controller)
        const res = await fetch(`${API_BASE_URL}/therapists?page=0&size=100`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Failed to load therapists");
        const page = await res.json(); // Page<Therapist>
        const mapped = page.content.map((t) => ({
          id: t.id,
          name: `${t.firstName ?? ""} ${t.lastName ?? ""}`.trim() || t.username,
          username: t.username,
          email: t.email,
          role: ROLE_LABELS[t.role] ?? t.role,
          phone: t.phoneNumber || "",
        }));
        setTherapists(mapped);
      } catch (e) {
        console.error(e);
        alert(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  /* ───────────────── delete helper ───────────────── */
  const deleteTherapist = async (id) => {
    if (!confirm("Delete / deactivate this therapist?")) return;
    try {
      const res = await fetch(`${API_BASE_URL}/therapists/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      // handle possible empty body
      const text = await res.text();
      if (!res.ok) {
        let message = "Delete failed";
        try {
          message = JSON.parse(text).message || message;
        } catch (_) { }
        throw new Error(message);
      }

      setTherapists((prev) => prev.filter((t) => t.id !== id));
    } catch (err) {
      console.error(err);
      alert(err.message);
    }
  };

  const filtered = therapists.filter((t) =>
    `${t.name} ${t.username} ${t.email}`
      .toLowerCase()
      .includes(query.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <h2 className="text-2xl font-semibold text-brandLavender">
        Manage Therapists
      </h2>

      {/* search */}
      <div className="relative max-w-sm">
        <input
          type="text"
          placeholder="Search therapists…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full border rounded pl-10 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-brandLavender"
        />
        <SearchIcon
          size={18}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
        />
      </div>

      {/* loading state */}
      {loading && <p className="text-center text-gray-500">Loading…</p>}

      {/* grid */}
      {!loading && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((th) => (
            <div
              key={th.id}
              className="bg-white rounded-xl shadow-md hover:shadow-lg transition"
            >
              {/* body */}
              <div className="p-4 space-y-1">
                <p className="font-semibold text-lg">{th.name}</p>
                <p className="text-sm text-gray-600">Role: {th.role}</p>
                {th.email && (
                  <p className="text-sm text-gray-600 truncate">{th.email}</p>
                )}
                {th.phone && (
                  <p className="text-sm text-gray-600 truncate">{th.phone}</p>
                )}
                <p className="text-xs text-gray-400 italic">
                  Username: {th.username}
                </p>
              </div>

              {/* footer actions */}
              <div className="flex border-t border-gray-200 text-sm">
                {/* Example: detail/edit page if/when you add it */}
                <button
                  onClick={() => deleteTherapist(th.id)}
                  title="Delete therapist"
                  className="px-4 py-2 border-l border-gray-200 text-red-600 hover:bg-red-50 flex items-center justify-center"
                >
                  <Trash2Icon size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {filtered.length === 0 && !loading && (
        <p className="mt-8 text-center text-gray-500">
          No therapists match “{query}”.
        </p>
      )}
    </div>
  );
}
