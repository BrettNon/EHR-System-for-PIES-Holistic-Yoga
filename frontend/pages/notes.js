// pages/notes.js  (or wherever this lives)
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { SearchIcon } from "lucide-react";
import { API_BASE_URL } from "../utils/config";

/** helper: parse YYYY-MM-DD or ISO to safe Date (UTC to avoid off-by-one) */
function parseYmd(ymd) {
    if (!ymd) return null;
    if (ymd.includes("T")) return new Date(ymd);
    const [y, m, d] = ymd.split("-").map(Number);
    return new Date(Date.UTC(y, m - 1, d));
}

const TYPE_META = {
    SOAP: {
        label: "SOAP Note",
        color: "bg-purple-100 text-purple-800",
        endpoint: "soap-notes",
    },
    SELF: {
        label: "Self Assessment",
        color: "bg-pink-100 text-pink-800",
        endpoint: "self-assessments",
    },
    INTAKE: {
        label: "Intake Form",
        color: "bg-indigo-100 text-indigo-800",
        endpoint: "intakes",
    },
};

export default function TherapistNotesPage() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [query, setQuery] = useState("");
    const [filterTypes, setFilterTypes] = useState(new Set()); // empty = all

    const token =
        typeof window !== "undefined" ? localStorage.getItem("pies-token") : null;

    useEffect(() => {
        if (!token) return;
        (async () => {
            try {
                const headers = { Authorization: `Bearer ${token}` };

                const [soapRes, selfRes, intakeRes] = await Promise.all([
                    fetch(`${API_BASE_URL}/${TYPE_META.SOAP.endpoint}?page=0&size=100`, { headers }),
                    fetch(`${API_BASE_URL}/${TYPE_META.SELF.endpoint}?page=0&size=100`, { headers }),
                    fetch(`${API_BASE_URL}/${TYPE_META.INTAKE.endpoint}?page=0&size=100`, { headers }),
                ]);

                if (!soapRes.ok || !selfRes.ok || !intakeRes.ok) {
                    throw new Error("Failed to load one or more note lists");
                }

                const [soapPage, selfPage, intakePage] = await Promise.all([
                    soapRes.json(),
                    selfRes.json(),
                    intakeRes.json(),
                ]);

                const normalize = (arr, typeKey) =>
                    (arr?.content ?? []).map((row) => {
                        const patient = row.patient || row.client || row.patientDto || {};
                        const patientName = `${patient.firstName ?? ""} ${patient.lastName ?? ""}`.trim();

                        const dateStr =
                            row.dateSubmitted ||
                            row.date ||
                            row.intakeDate ||
                            row.createdAt ||
                            row.updatedAt ||
                            row.submittedAt;

                        return {
                            id: row.id,
                            type: typeKey,
                            patientName: patientName || "Unknown patient",
                            date: parseYmd(dateStr) || new Date(),
                            href: `/notes/view?type=${typeKey.toLowerCase()}&id=${row.id}`,
                        };
                    });

                const unified = [
                    ...normalize(soapPage, "SOAP"),
                    ...normalize(selfPage, "SELF"),
                    ...normalize(intakePage, "INTAKE"),
                ].sort((a, b) => b.date - a.date);

                setItems(unified);
            } catch (e) {
                console.error(e);
                alert(e.message);
            } finally {
                setLoading(false);
            }
        })();
    }, [token]);

    const filtered = useMemo(() => {
        const q = query.toLowerCase();
        return items.filter((item) => {
            const matchesText =
                item.patientName.toLowerCase().includes(q) ||
                TYPE_META[item.type].label.toLowerCase().includes(q);
            const matchesType = filterTypes.size === 0 || filterTypes.has(item.type);
            return matchesText && matchesType;
        });
    }, [items, query, filterTypes]);

    const toggleType = (t) => {
        setFilterTypes((prev) => {
            const next = new Set(prev);
            next.has(t) ? next.delete(t) : next.add(t);
            return next;
        });
    };

    return (
        <div className="max-w-6xl mx-auto py-10 space-y-8">

            {/* controls */}
            <div className="flex flex-col md:flex-row md:items-center gap-4">
                {/* search */}
                <div className="relative flex-1 max-w-md">
                    <input
                        type="text"
                        placeholder="Search by patient or type…"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        className="w-full border rounded pl-10 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-brandLavender"
                    />
                    <SearchIcon
                        size={18}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    />
                </div>

                {/* type chips */}
                <div className="flex flex-wrap gap-2">
                    {Object.entries(TYPE_META).map(([key, meta]) => {
                        const active = filterTypes.has(key);
                        return (
                            <button
                                key={key}
                                onClick={() => toggleType(key)}
                                className={`px-3 py-1 rounded-full text-sm font-medium transition ${active
                                    ? "bg-purple-600 text-white shadow"
                                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                    }`}
                            >
                                {meta.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* list */}
            {loading && <p className="text-center text-gray-500 pt-10">Loading notes…</p>}

            {!loading && filtered.length === 0 && (
                <p className="text-center text-gray-500 pt-10">
                    Nothing found{query ? ` for “${query}”` : ""}.
                </p>
            )}

            <ul className="space-y-4">
                {filtered.map((item) => {
                    const meta = TYPE_META[item.type];
                    return (
                        <li
                            key={`${item.type}-${item.id}`}
                            className="group relative rounded-xl bg-white shadow-md hover:shadow-xl transition overflow-hidden"
                        >
                            {/* subtle gradient bar on the left */}
                            <span
                                className="absolute top-0 left-0 h-full w-1 bg-gradient-to-b from-purple-400 to-purple-600" />
                            <div className="p-5 pl-6 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6">
                                {/* badge */}
                                <span
                                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${meta.color}`}
                                >
                                    {meta.label}
                                </span>

                                <div className="flex-1">
                                    <p className="font-semibold text-lg text-gray-800">{item.patientName}</p>
                                    <p className="text-sm text-gray-500">
                                        {new Intl.DateTimeFormat(undefined, {
                                            dateStyle: "medium",
                                            timeStyle: "short",
                                        }).format(item.date)}
                                    </p>
                                </div>

                                <Link
                                    href={item.href}
                                    className="text-brandLavender hover:underline text-sm font-medium self-start sm:self-auto"
                                >
                                    View
                                </Link>
                            </div>

                            {/* hover overlay effect */}
                            <div
                                className="absolute inset-0 opacity-0 group-hover:opacity-5 bg-gradient-to-r from-purple-600 to-purple-300 transition pointer-events-none" />
                        </li>
                    );
                })}
            </ul>
        </div>
    );
}
