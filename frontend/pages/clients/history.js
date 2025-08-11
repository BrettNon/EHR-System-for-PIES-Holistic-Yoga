// pages/clients/history.js
import { useEffect, useMemo, useState } from "react";

/* Small helpers */
const toLocalNoZ = (d) => {
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` +
         `T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
};
const iso = (d) => new Date(d).toISOString();
const today = new Date();
const addDays = (d, n) => {
  const c = new Date(d);
  c.setDate(c.getDate() + n);
  return c;
};
const ymd = (d) => new Date(d).toISOString().slice(0, 10);
const fmtDateTime = (s) =>
  new Date(s).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

export default function ClientHistoryPage() {
  const [loading, setLoading] = useState(false);
  const [appointments, setAppointments] = useState([]);

  // Filters
  const [fromDate, setFromDate] = useState(ymd(addDays(today, -90)));
  const [toDate, setToDate] = useState(ymd(addDays(today, 90)));
  const [selectedPatientId, setSelectedPatientId] = useState("");
  const [patients, setPatients] = useState([]);

  // Modal state for create
  const [openCreate, setOpenCreate] = useState(false);
  const [form, setForm] = useState({
    patientId: "",
    date: ymd(today),
    time: "10:00",
    durationMinutes: 60,
    notes: "",
  });

  const token =
    typeof window !== "undefined" ? localStorage.getItem("pies-token") : null;
  const therapistId =
    typeof window !== "undefined"
      ? localStorage.getItem("therapistId") || "1"
      : "1";

  /* Load patients for selects (same endpoint you used elsewhere) */
  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        const res = await fetch(
          "http://localhost:8080/patients?page=0&size=500",
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (!res.ok) return;
        const page = await res.json();
        setPatients(
          page.content.map((p) => ({
            id: String(p.id),
            name: `${p.firstName ?? ""} ${p.lastName ?? ""}`.trim() || `#${p.id}`,
          }))
        );
      } catch (e) {
        console.error("Load patients failed:", e);
      }
    })();
  }, [token]);

  /* Load appointments */
  const loadAppointments = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const fromDt = new Date(`${fromDate}T00:00:00`);
      const toDt   = new Date(`${toDate}T23:59:59`);

      const q = `from=${encodeURIComponent(toLocalNoZ(fromDt))}` +
                `&to=${encodeURIComponent(toLocalNoZ(toDt))}`;

      const url = selectedPatientId
        ? `http://localhost:8080/appointments/patient/${Number(selectedPatientId)}?${q}`
        : `http://localhost:8080/appointments/therapist/${Number(therapistId)}?${q}`;

      console.log("GET", url); // helpful while testing
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error("Failed to load appointments");
      const data = await res.json();
      setAppointments(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      alert("Unable to load appointments.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAppointments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPatientId, fromDate, toDate]);

  /* Derived lists */
  const { upcoming, past } = useMemo(() => {
    const now = Date.now();
    const sorted = [...appointments].sort(
      (a, b) => new Date(a.appointmentTime) - new Date(b.appointmentTime)
    );
    const up = sorted.filter((a) => new Date(a.appointmentTime).getTime() > now);
    const pa = sorted
      .filter((a) => new Date(a.appointmentTime).getTime() <= now)
      .reverse(); // newest first
    return { upcoming: up, past: pa };
  }, [appointments]);

  /* Create appointment */
  const openCreateModal = () => {
    setForm((f) => ({
      ...f,
      patientId: selectedPatientId || f.patientId || (patients[0]?.id ?? ""),
      date: ymd(today),
      time: "10:00",
      durationMinutes: 60,
      notes: "",
    }));
    setOpenCreate(true);
  };

  const createAppointment = async (e) => {
    e.preventDefault();
    if (!form.patientId) return alert("Please choose a patient.");
    const appointmentTime = `${form.date}T${form.time}:00`; // local, no Z
    try {
      const res = await fetch("http://localhost:8080/appointments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          therapistId: Number(therapistId),
          patientId: Number(form.patientId),
          appointmentTime, 
          durationMinutes: Number(form.durationMinutes),
          notes: form.notes || "",
        }),
      });
      if (!res.ok) throw new Error("Create failed");
      setOpenCreate(false);
      await loadAppointments();
    } catch (e) {
      console.error(e);
      alert("Could not create the appointment.");
    }
  };

  /* Delete (cancel) appointment */
  const cancelAppointment = async (id) => {
    if (!confirm("Cancel this appointment?")) return;
    try {
      const res = await fetch(`http://localhost:8080/appointments/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Delete failed");
      await loadAppointments();
    } catch (e) {
      console.error(e);
      alert("Could not cancel the appointment.");
    }
  };

  /* UI */
  return (
    <div className="max-w-5xl mx-auto space-y-10">
      {/* Filters + actions */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="block text-sm font-medium text-brandLavender">
              From
            </label>
            <input
              type="date"
              className="border rounded p-2 text-sm"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-brandLavender">
              To
            </label>
            <input
              type="date"
              className="border rounded p-2 text-sm"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-brandLavender">
              Patient (optional)
            </label>
            <select
              className="border rounded p-2 text-sm min-w-[14rem]"
              value={selectedPatientId}
              onChange={(e) => setSelectedPatientId(e.target.value)}
            >
              <option value="">— All (by therapist) —</option>
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={loadAppointments}
            className="h-10 px-4 rounded bg-gray-100 hover:bg-gray-200 text-sm"
            disabled={loading}
            title="Refresh"
          >
            Refresh
          </button>
        </div>

        <button
          onClick={openCreateModal}
          className="bg-brandLavender hover:opacity-90 text-white text-sm px-4 py-2 rounded self-start md:self-auto"
        >
          Schedule an appointment
        </button>
      </div>

      {/* Upcoming */}
      <section className="space-y-3">
        <h3 className="text-lg font-semibold text-brandLavender">
          Upcoming appointments
        </h3>
        {loading ? (
          <div className="border rounded p-6 text-center text-gray-500">
            Loading…
          </div>
        ) : upcoming.length === 0 ? (
          <div className="border rounded p-6 text-center text-gray-500">
            There are no upcoming visits to display.
          </div>
        ) : (
          <ul className="divide-y rounded border">
            {upcoming.map((a) => (
              <li
                key={a.id}
                className="p-4 flex items-center justify-between gap-4"
              >
                <div>
                  <div className="font-medium">
                    {fmtDateTime(a.appointmentTime)}
                  </div>
                  <div className="text-sm text-gray-600">
                    Duration: {a.durationMinutes} min
                    {a.notes ? ` — ${a.notes}` : ""}
                  </div>
                </div>
                <button
                  onClick={() => cancelAppointment(a.id)}
                  className="text-sm text-red-600 hover:underline"
                >
                  Cancel
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Past */}
      <section className="space-y-3">
        <h3 className="text-lg font-semibold text-brandLavender">Past visits</h3>
        {loading ? (
          <div className="border rounded p-6 text-center text-gray-500">
            Loading…
          </div>
        ) : past.length === 0 ? (
          <div className="border rounded p-6 text-center text-gray-500">
            No past visits in this range.
          </div>
        ) : (
          <ul className="divide-y rounded border">
            {past.map((a) => (
              <li key={a.id} className="p-4">
                <div className="font-medium">
                  {fmtDateTime(a.appointmentTime)}
                </div>
                <div className="text-sm text-gray-600">
                  Duration: {a.durationMinutes} min
                  {a.notes ? ` — ${a.notes}` : ""}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Create modal */}
      {openCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setOpenCreate(false)}
          />
          <form
            onSubmit={createAppointment}
            className="relative bg-white rounded-xl shadow-xl w-full max-w-lg p-6 space-y-4"
          >
            <h4 className="text-lg font-semibold text-brandLavender">
              Schedule an appointment
            </h4>

            <div>
              <label className="block text-sm font-medium mb-1">
                Patient <span className="text-red-500">*</span>
              </label>
              <select
                className="w-full border rounded p-2"
                value={form.patientId}
                onChange={(e) =>
                  setForm((f) => ({ ...f, patientId: e.target.value }))
                }
                required
              >
                <option value="" disabled>
                  — Select —
                </option>
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">Date</label>
                <input
                  type="date"
                  className="w-full border rounded p-2"
                  value={form.date}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, date: e.target.value }))
                  }
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Time</label>
                <input
                  type="time"
                  className="w-full border rounded p-2"
                  value={form.time}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, time: e.target.value }))
                  }
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Duration (minutes)
                </label>
                <input
                  type="number"
                  min={5}
                  step={5}
                  className="w-full border rounded p-2"
                  value={form.durationMinutes}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      durationMinutes: e.target.value,
                    }))
                  }
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Notes</label>
                <input
                  type="text"
                  className="w-full border rounded p-2"
                  value={form.notes}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, notes: e.target.value }))
                  }
                  placeholder="Optional"
                  maxLength={255}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setOpenCreate(false)}
                className="px-4 py-2 rounded border"
              >
                Close
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded bg-brandLavender text-white"
              >
                Save
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
