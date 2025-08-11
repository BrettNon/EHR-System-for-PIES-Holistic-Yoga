// pages/clients/assigned.js
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { SearchIcon, Trash2Icon } from "lucide-react";

export default function AssignedClientsPage() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);

  // search + filters
  const [query, setQuery] = useState("");

  // age slider (dual-range) 1–120
  const MIN_AGE = 1;
  const MAX_AGE = 120;
  const [ageMin, setAgeMin] = useState(MIN_AGE);
  const [ageMax, setAgeMax] = useState(MAX_AGE);

  // client since (YYYY-MM-DD)
  const [sinceFrom, setSinceFrom] = useState("");
  const [sinceTo, setSinceTo] = useState("");

  // sort: alpha, age, recency
  const [sortBy, setSortBy] = useState("alpha");

  const token =
    typeof window !== "undefined" ? localStorage.getItem("pies-token") : null;

  function parseYmd(ymd) {
    if (!ymd) return null;
    const [y, m, d] = ymd.split("-").map(Number);
    return new Date(Date.UTC(y, m - 1, d + 1));
  }
  const fmtMonthYear = (ymd) =>
    ymd
      ? new Intl.DateTimeFormat(undefined, { year: "numeric", month: "long" }).format(parseYmd(ymd))
      : "—";
  const fmtFullDate = (ymd) =>
    ymd
      ? new Intl.DateTimeFormat(undefined, { year: "numeric", month: "long", day: "numeric" }).format(parseYmd(ymd))
      : "—";
  const toYmd = (s) => (typeof s === "string" ? s.slice(0, 10) : "");
  const calcAgeFromYmd = (ymd) => {
    if (!ymd) return null;
    const [y, m, d] = ymd.split("-").map(Number);
    const today = new Date();
    let age = today.getFullYear() - y;
    const mDiff = today.getMonth() + 1 - m;
    const dDiff = today.getDate() - d;
    if (mDiff < 0 || (mDiff === 0 && dDiff < 0)) age--;
    return age;
  };

  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        const res = await fetch("http://localhost:8080/patients?page=0&size=100", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Failed to load patients");
        const page = await res.json();
        const mapped = page.content.map((p) => ({
          id: p.id,
          name: `${p.firstName ?? ""} ${p.lastName ?? ""}`.trim(),
          since: toYmd(p.dateCreated || p.createdAt || ""),
          dob: toYmd(p.dateOfBirth || ""),
        }));
        setClients(mapped);
      } catch (e) {
        console.error(e);
        alert(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  const deleteClient = async (id) => {
    if (!confirm("Delete this client?")) return;
    try {
      const res = await fetch(`http://localhost:8080/patients/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const text = await res.text();
      if (!res.ok) {
        let message = "Delete failed";
        try {
          message = JSON.parse(text).message || message;
        } catch {}
        throw new Error(message);
      }
      setClients((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      console.error(err);
      alert(err.message);
    }
  };

  const processed = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = clients.filter((c) => {
      if (q && !c.name.toLowerCase().includes(q)) return false;

      const age = calcAgeFromYmd(c.dob);
      if (age != null) {
        if (age < ageMin || age > ageMax) return false;
      } else if (ageMin !== MIN_AGE || ageMax !== MAX_AGE) return false;

      const since = c.since;
      if (sinceFrom && (!since || since < sinceFrom)) return false;
      if (sinceTo && (!since || since > sinceTo)) return false;

      return true;
    });

    const sorted = [...filtered].sort((a, b) => {
      if (sortBy === "alpha") {
        return (a.name || "").toLowerCase().localeCompare((b.name || "").toLowerCase());
      }
      if (sortBy === "age") {
        const aa = calcAgeFromYmd(a.dob);
        const ab = calcAgeFromYmd(b.dob);
        if (aa == null && ab == null) return 0;
        if (aa == null) return 1;
        if (ab == null) return -1;
        return aa - ab; // youngest → oldest
      }
      if (sortBy === "recency") {
        const sa = a.since || "";
        const sb = b.since || "";
        if (!sa && !sb) return 0;
        if (!sa) return 1;
        if (!sb) return -1;
        return sb.localeCompare(sa); // newest → oldest
      }
      return 0;
    });

    return sorted;
  }, [clients, query, ageMin, ageMax, sinceFrom, sinceTo, sortBy]);

  const resetFilters = () => {
    setQuery("");
    setAgeMin(MIN_AGE);
    setAgeMax(MAX_AGE);
    setSinceFrom("");
    setSinceTo("");
    setSortBy("alpha");
  };

  const handleAgeMin = (v) => setAgeMin(Math.max(MIN_AGE, Math.min(Number(v), ageMax)));
  const handleAgeMax = (v) => setAgeMax(Math.min(MAX_AGE, Math.max(Number(v), ageMin)));

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <h2 className="text-2xl font-semibold text-brandLavender">Assigned Clients</h2>

      {/* Filters – one line on md+; scrolls horizontally if cramped */}
      <div className="flex flex-wrap md:flex-nowrap items-end gap-4 overflow-x-auto pb-2">
        {/* Search */}
        <div className="relative w-[280px] shrink-0">
          <label className="block text-sm font-medium text-brandLavender mb-1">Search</label>
          <input
            type="text"
            placeholder="Search clients…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full border rounded pl-10 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-brandLavender"
          />
          <SearchIcon
            size={18}
            className="absolute left-3 top-[2.35rem] -translate-y-1/2 text-gray-400 pointer-events-none"
          />
        </div>

        {/* Age range (dual slider) */}
        <div className="w-[300px] shrink-0">
          <label className="block text-sm font-medium text-brandLavender mb-1">
            Age range ({ageMin} – {ageMax})
          </label>
          <div className="relative py-3 w-full">
            <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-1 bg-gray-200 rounded" />
            <div
              className="absolute top-1/2 -translate-y-1/2 h-1 bg-brandLavender rounded"
              style={{
                left: `${((ageMin - MIN_AGE) / (MAX_AGE - MIN_AGE)) * 100}%`,
                right: `${(1 - (ageMax - MIN_AGE) / (MAX_AGE - MIN_AGE)) * 100}%`,
              }}
            />
            <input
              type="range"
              min={MIN_AGE}
              max={MAX_AGE}
              value={ageMin}
              onChange={(e) => handleAgeMin(e.target.value)}
              className="absolute left-0 right-0 top-1/2 -translate-y-1/2 w-full appearance-none bg-transparent pointer-events-auto"
            />
            <input
              type="range"
              min={MIN_AGE}
              max={MAX_AGE}
              value={ageMax}
              onChange={(e) => handleAgeMax(e.target.value)}
              className="absolute left-0 right-0 top-1/2 -translate-y-1/2 w-full appearance-none bg-transparent pointer-events-auto"
            />
            <style jsx>{`
              input[type="range"]::-webkit-slider-thumb {
                -webkit-appearance: none;
                appearance: none;
                width: 18px;
                height: 18px;
                border-radius: 9999px;
                background: #7c3aed;
                border: 2px solid white;
                box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
                cursor: pointer;
                position: relative;
              }
              input[type="range"]::-moz-range-thumb {
                width: 18px;
                height: 18px;
                border-radius: 9999px;
                background: #7c3aed;
                border: 2px solid white;
                box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
                cursor: pointer;
              }
              input[type="range"] {
                height: 18px;
              }
            `}</style>
          </div>
        </div>

        {/* Client since (from/to) */}
        <div className="shrink-0">
          <label className="block text-sm font-medium text-brandLavender mb-1">Since</label>
          <div className="flex gap-3">
            <input
              type="date"
              className="w-[155px] border rounded p-2"
              value={sinceFrom}
              onChange={(e) => setSinceFrom(e.target.value)}
              aria-label="Since from"
            />
            <input
              type="date"
              className="w-[155px] border rounded p-2"
              value={sinceTo}
              onChange={(e) => setSinceTo(e.target.value)}
              aria-label="Since to"
            />
          </div>
        </div>

        {/* Sort */}
        <div className="w-[230px] shrink-0">
          <label className="block text-sm font-medium text-brandLavender mb-1">Sort by</label>
          <select
            className="w-full border rounded p-2"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="alpha">Alphabetical (A → Z)</option>
            <option value="age">Age (youngest → oldest)</option>
            <option value="recency">Client Since (newest → oldest)</option>
          </select>
        </div>

        {/* Reset */}
        <div className="w-[100px] shrink-0">
          <button
            onClick={resetFilters}
            className="w-full h-[42px] rounded border hover:bg-gray-50 mt-6"
            title="Clear all filters"
          >
            Reset
          </button>
        </div>
      </div>

      {loading && <p className="text-center text-gray-500">Loading…</p>}

      {!loading && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {processed.map((cl) => (
            <div key={cl.id} className="bg-white rounded-xl shadow-md hover:shadow-lg transition">
              <div className="p-4 space-y-1">
                <p className="font-semibold text-lg">{cl.name || "Unnamed Client"}</p>
                <p className="text-sm text-gray-600">Client since {fmtMonthYear(cl.since)}</p>
                <p className="text-sm text-gray-600">DOB: {fmtFullDate(cl.dob)}</p>
              </div>
              <div className="flex border-t border-gray-200 text-sm">
                <Link
                  href={`/clients/history?clientId=${cl.id}`}
                  className="flex-1 px-4 py-2 text-brandLavender hover:bg-gray-50 text-center"
                >
                  View record
                </Link>
                <button
                  onClick={() => deleteClient(cl.id)}
                  title="Delete client"
                  className="px-4 py-2 border-l border-gray-200 text-red-600 hover:bg-red-50 flex items-center justify-center"
                >
                  <Trash2Icon size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {processed.length === 0 && !loading && (
        <p className="mt-8 text-center text-gray-500">No clients match your filters.</p>
      )}
    </div>
  );
}
