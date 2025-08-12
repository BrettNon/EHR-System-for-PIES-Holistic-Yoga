// pages/clients/all.js
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { SearchIcon, Trash2Icon, SlidersHorizontal } from "lucide-react";
import { API_BASE_URL } from "../../utils/config";

// add near top of the file
const STATE_MAP = {
  alabama: "AL", alaska: "AK", arizona: "AZ", arkansas: "AR", california: "CA",
  colorado: "CO", connecticut: "CT", delaware: "DE", "district of columbia": "DC",
  florida: "FL", georgia: "GA", hawaii: "HI", idaho: "ID", illinois: "IL",
  indiana: "IN", iowa: "IA", kansas: "KS", kentucky: "KY", louisiana: "LA",
  maine: "ME", maryland: "MD", massachusetts: "MA", michigan: "MI", minnesota: "MN",
  mississippi: "MS", missouri: "MO", montana: "MT", nebraska: "NE", nevada: "NV",
  "new hampshire": "NH", "new jersey": "NJ", "new mexico": "NM", "new york": "NY",
  "north carolina": "NC", "north dakota": "ND", ohio: "OH", oklahoma: "OK",
  oregon: "OR", pennsylvania: "PA", "rhode island": "RI", "south carolina": "SC",
  "south dakota": "SD", tennessee: "TN", texas: "TX", utah: "UT", vermont: "VT",
  virginia: "VA", washington: "WA", "west virginia": "WV", wisconsin: "WI", wyoming: "WY"
};
const normalizeState = (v) => {
  if (!v) return "";
  const t = v.trim();
  const code = t.toUpperCase();
  if (/^[A-Z]{2}$/.test(code)) return code;
  return STATE_MAP[t.toLowerCase()] || code.slice(0, 2);
};

const US_STATES = [
  { code: "AL", name: "Alabama" }, { code: "AK", name: "Alaska" }, { code: "AZ", name: "Arizona" },
  { code: "AR", name: "Arkansas" }, { code: "CA", name: "California" }, { code: "CO", name: "Colorado" },
  { code: "CT", name: "Connecticut" }, { code: "DE", name: "Delaware" }, { code: "DC", name: "District of Columbia" },
  { code: "FL", name: "Florida" }, { code: "GA", name: "Georgia" }, { code: "HI", name: "Hawaii" },
  { code: "ID", name: "Idaho" }, { code: "IL", name: "Illinois" }, { code: "IN", name: "Indiana" },
  { code: "IA", name: "Iowa" }, { code: "KS", name: "Kansas" }, { code: "KY", name: "Kentucky" },
  { code: "LA", name: "Louisiana" }, { code: "ME", name: "Maine" }, { code: "MD", name: "Maryland" },
  { code: "MA", name: "Massachusetts" }, { code: "MI", name: "Michigan" }, { code: "MN", name: "Minnesota" },
  { code: "MS", name: "Mississippi" }, { code: "MO", name: "Missouri" }, { code: "MT", name: "Montana" },
  { code: "NE", name: "Nebraska" }, { code: "NV", name: "Nevada" }, { code: "NH", name: "New Hampshire" },
  { code: "NJ", name: "New Jersey" }, { code: "NM", name: "New Mexico" }, { code: "NY", name: "New York" },
  { code: "NC", name: "North Carolina" }, { code: "ND", name: "North Dakota" }, { code: "OH", name: "Ohio" },
  { code: "OK", name: "Oklahoma" }, { code: "OR", name: "Oregon" }, { code: "PA", name: "Pennsylvania" },
  { code: "RI", name: "Rhode Island" }, { code: "SC", name: "South Carolina" }, { code: "SD", name: "South Dakota" },
  { code: "TN", name: "Tennessee" }, { code: "TX", name: "Texas" }, { code: "UT", name: "Utah" },
  { code: "VT", name: "Vermont" }, { code: "VA", name: "Virginia" }, { code: "WA", name: "Washington" },
  { code: "WV", name: "West Virginia" }, { code: "WI", name: "Wisconsin" }, { code: "WY", name: "Wyoming" },
];

export default function AllClientsPage() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);

  // therapists for assignment (NEW)
  const [therapists, setTherapists] = useState([]);

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
  const [sortBy, setSortBy] = useState("alpha"); // 'alpha' | 'age' | 'recency'

  // filters menu
  const [filtersOpen, setFiltersOpen] = useState(false);
  const menuRef = useRef(null);

  // create modal
  const [openCreate, setOpenCreate] = useState(false);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    dateOfBirth: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    email: "",
    homePhoneNumber: "",
    cellPhoneNumber: "",
    workPhoneNumber: "",
    emergencyContactName: "",
    emergencyContactPhone: "",
    referredBy: "",
    therapistId: "", // NEW: required
  });

  const token =
    typeof window !== "undefined" ? localStorage.getItem("pies-token") : null;
  const myTherapistId =
    typeof window !== "undefined"
      ? Number(localStorage.getItem("therapistId") || "0")
      : 0;

  // ---------- helpers ----------
  function parseYmd(ymd) {
    if (!ymd) return null;
    const [y, m, d] = ymd.split("-").map(Number);
    return new Date(Date.UTC(y, m - 1, d + 1)); // keep UTC fudge
  }
  const fmtMonthYear = (ymd) =>
    ymd
      ? new Intl.DateTimeFormat(undefined, { year: "numeric", month: "long" }).format(parseYmd(ymd))
      : "—";
  const fmtFullDate = (ymd) =>
    ymd
      ? new Intl.DateTimeFormat(undefined, {
        year: "numeric",
        month: "long",
        day: "numeric",
      }).format(parseYmd(ymd))
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

  // close filters on outside click / Escape
  useEffect(() => {
    const onClick = (e) => {
      if (!filtersOpen) return;
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setFiltersOpen(false);
      }
    };
    const onKey = (e) => {
      if (e.key === "Escape") setFiltersOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [filtersOpen]);

  // ---------- fetch ALL patients ----------
  const loadClients = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/patients?page=0&size=100`, {
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
  };

  // ---------- fetch active therapists (NEW) ----------
  const loadTherapists = async () => {
    if (!token) return;
    try {
      const res = await fetch("http://localhost:8080/therapists/active", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to load therapists");
      const data = await res.json();
      setTherapists(Array.isArray(data) ? data : []);
      // preselect current therapist if available
      const mine = (Array.isArray(data) ? data : []).find((t) => Number(t.id) === Number(myTherapistId));
      setForm((f) => ({ ...f, therapistId: mine ? String(mine.id) : "" }));
    } catch (e) {
      console.error(e);
      // don't block page; leave list empty
    }
  };

  useEffect(() => {
    loadClients();
    loadTherapists();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // ---------- delete helper ----------
  const deleteClient = async (id) => {
    if (!confirm("Delete this client?")) return;
    try {
      const res = await fetch(`${API_BASE_URL}/patients/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      const text = await res.text(); // safe parse for empty bodies
      if (!res.ok) {
        let message = "Delete failed";
        try {
          message = JSON.parse(text).message || message;
        } catch (_) { }
        throw new Error(message);
      }
      setClients((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      console.error(err);
      alert(err.message);
    }
  };

  // ---------- CREATE helper ----------
  const createClient = async (e) => {
    e.preventDefault();
    if (!form.firstName.trim() || !form.lastName.trim() || !form.dateOfBirth) {
      alert("First name, last name, and date of birth are required.");
      return;
    }
    if (!form.therapistId) {
      alert("Please select a therapist to assign this client to.");
      return;
    }
    try {
      const res = await fetch(`${API_BASE_URL}/patients`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...form,
          state: normalizeState(form.state),
          therapistId: Number(form.therapistId), // assign from selection (REQUIRED)
        }),
      });
      if (!res.ok) {
        const msg = await res.text().catch(() => "");
        throw new Error(msg || "Create failed");
      }
      setOpenCreate(false);
      setForm({
        firstName: "",
        lastName: "",
        dateOfBirth: "",
        address: "",
        city: "",
        state: "",
        zipCode: "",
        email: "",
        homePhoneNumber: "",
        cellPhoneNumber: "",
        workPhoneNumber: "",
        emergencyContactName: "",
        emergencyContactPhone: "",
        referredBy: "",
        therapistId: myTherapistId ? String(myTherapistId) : "",
      });
      await loadClients();
    } catch (err) {
      console.error(err);
      alert(err.message);
    }
  };

  // ---------- filtering + sorting ----------
  const processed = useMemo(() => {
    const q = query.trim().toLowerCase();

    const filtered = clients.filter((c) => {
      if (q && !c.name.toLowerCase().includes(q)) return false;

      const age = calcAgeFromYmd(c.dob);
      if (age != null) {
        if (age < ageMin || age > ageMax) return false;
      } else {
        if (ageMin !== MIN_AGE || ageMax !== MAX_AGE) return false;
      }

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

  const activeFilterCount =
    (ageMin !== MIN_AGE ? 1 : 0) +
    (ageMax !== MAX_AGE ? 1 : 0) +
    (sinceFrom ? 1 : 0) +
    (sinceTo ? 1 : 0) +
    (sortBy !== "alpha" ? 1 : 0);

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header with Create */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-brandLavender">All Clients</h2>
        <button
          onClick={() => setOpenCreate(true)}
          className="px-4 py-2 rounded bg-brandLavender text-white text-sm"
        >
          New client
        </button>
      </div>

      {/* Search + Filters button */}
      <div className="flex items-end gap-3">
        {/* Search */}
        <div className="relative w-full sm:w-[320px]">
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
            className="absolute left-3 top=[2.35rem] -translate-y-1/2 text-gray-400 pointer-events-none"
            style={{ top: "2.35rem" }}
          />
        </div>

        {/* Filters menu trigger */}
        <div className="relative" ref={menuRef}>
          <label className="block text-sm font-medium text-transparent mb-1 select-none">.</label>
          <button
            type="button"
            aria-haspopup="dialog"
            aria-expanded={filtersOpen}
            aria-controls="filters-menu"
            onClick={() => setFiltersOpen((o) => !o)}
            className="inline-flex items-center gap-2 px-3 py-2 border rounded hover:bg-gray-50"
            title="Open filters"
          >
            <SlidersHorizontal size={18} />
            Filters
            {activeFilterCount > 0 && (
              <span className="ml-1 text-xs px-1.5 py-0.5 rounded bg-brandLavender text-white">
                {activeFilterCount}
              </span>
            )}
          </button>

          {/* Menu panel */}
          {filtersOpen && (
            <div
              id="filters-menu"
              role="dialog"
              aria-label="Filters"
              className="absolute z-50 mt-2 right-0 w-[360px] max-w-[90vw] bg-white border rounded-xl shadow-xl p-4"
            >
              {/* Age range */}
              <div className="mb-4">
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
                      box-shadow: 0 1px 3px rgba(0,0,0,0.2);
                      cursor: pointer;
                      position: relative;
                    }
                    input[type="range"]::-moz-range-thumb {
                      width: 18px;
                      height: 18px;
                      border-radius: 9999px;
                      background: #7c3aed;
                      border: 2px solid white;
                      box-shadow: 0 1px 3px rgba(0,0,0,0.2);
                      cursor: pointer;
                    }
                    input[type="range"] { height: 18px; }
                  `}</style>
                </div>
              </div>

              {/* Since range */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-brandLavender mb-1">Client since</label>
                <div className="flex gap-2">
                  <input
                    type="date"
                    className="w-1/2 border rounded p-2"
                    value={sinceFrom}
                    onChange={(e) => setSinceFrom(e.target.value)}
                    aria-label="Since from"
                  />
                  <input
                    type="date"
                    className="w-1/2 border rounded p-2"
                    value={sinceTo}
                    onChange={(e) => setSinceTo(e.target.value)}
                    aria-label="Since to"
                  />
                </div>
              </div>

              {/* Sort */}
              <div className="mb-4">
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

              {/* Actions */}
              <div className="flex items-center justify-between">
                <button
                  onClick={() => {
                    resetFilters();
                  }}
                  className="px-3 py-2 rounded border hover:bg-gray-50"
                  title="Clear all filters"
                  type="button"
                >
                  Reset
                </button>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setFiltersOpen(false)}
                    className="px-3 py-2 rounded border hover:bg-gray-50"
                  >
                    Close
                  </button>
                  <button
                    type="button"
                    onClick={() => setFiltersOpen(false)}
                    className="px-3 py-2 rounded bg-brandLavender text-white"
                  >
                    Apply
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Results */}
      {loading && <p className="text-center text-gray-500">Loading…</p>}

      {!loading && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {processed.map((cl) => (
            <div
              key={cl.id}
              className="bg-white rounded-xl shadow-md hover:shadow-lg transition"
            >
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

      {/* Create modal */}
      {openCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpenCreate(false)} />
          <form
            onSubmit={createClient}
            className="relative bg-white rounded-xl shadow-xl w-full max-w-2xl p-6 space-y-4"
          >
            <h4 className="text-lg font-semibold text-brandLavender">New client</h4>

            {/* Therapist assignment (REQUIRED) */}
            <div>
              <label className="block text-sm font-medium mb-1">Assign Therapist *</label>
              <select
                className="w-full border rounded p-2"
                value={form.therapistId}
                onChange={(e) => setForm((f) => ({ ...f, therapistId: e.target.value }))}
                required
              >
                <option value="">— Select therapist —</option>
                {therapists.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
              {therapists.length === 0 && (
                <p className="text-xs text-gray-500 mt-1">
                  No active therapists found. Please add therapists first.
                </p>
              )}
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">First name *</label>
                <input
                  className="w-full border rounded p-2"
                  value={form.firstName}
                  onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Last name *</label>
                <input
                  className="w-full border rounded p-2"
                  value={form.lastName}
                  onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Date of birth *</label>
                <input
                  type="date"
                  className="w-full border rounded p-2"
                  value={form.dateOfBirth}
                  onChange={(e) => setForm((f) => ({ ...f, dateOfBirth: e.target.value }))}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input
                  type="email"
                  className="w-full border rounded p-2"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">Address</label>
                <input
                  className="w-full border rounded p-2"
                  value={form.address}
                  onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">City</label>
                <input
                  className="w-full border rounded p-2"
                  value={form.city}
                  onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">State *</label>
                <select
                  className="w-full border rounded p-2"
                  value={form.state}
                  onChange={(e) => setForm((f) => ({ ...f, state: e.target.value }))}
                  required
                >
                  <option value="">— Select —</option>
                  {US_STATES.map((s) => (
                    <option key={s.code} value={s.code}>{s.name} ({s.code})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Zip code</label>
                <input
                  className="w-full border rounded p-2"
                  value={form.zipCode}
                  onChange={(e) => setForm((f) => ({ ...f, zipCode: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">Home phone</label>
                <input
                  className="w-full border rounded p-2"
                  value={form.homePhoneNumber}
                  onChange={(e) => setForm((f) => ({ ...f, homePhoneNumber: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Cell phone</label>
                <input
                  className="w-full border rounded p-2"
                  value={form.cellPhoneNumber}
                  onChange={(e) => setForm((f) => ({ ...f, cellPhoneNumber: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Work phone</label>
                <input
                  className="w-full border rounded p-2"
                  value={form.workPhoneNumber}
                  onChange={(e) => setForm((f) => ({ ...f, workPhoneNumber: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">Emergency contact name</label>
                <input
                  className="w-full border rounded p-2"
                  value={form.emergencyContactName}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, emergencyContactName: e.target.value }))
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Emergency contact phone</label>
                <input
                  className="w-full border rounded p-2"
                  value={form.emergencyContactPhone}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, emergencyContactPhone: e.target.value }))
                  }
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Referred by</label>
              <input
                className="w-full border rounded p-2"
                value={form.referredBy}
                onChange={(e) => setForm((f) => ({ ...f, referredBy: e.target.value }))}
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setOpenCreate(false)}
                className="px-4 py-2 rounded border"
              >
                Cancel
              </button>
              <button type="submit" className="px-4 py-2 rounded bg-brandLavender text-white">
                Save
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
