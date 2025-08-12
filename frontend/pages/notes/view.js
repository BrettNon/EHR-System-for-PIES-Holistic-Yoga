// pages/notes/view.js
import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { API_BASE_URL } from "../../utils/config";

/* ---------- helpers ---------- */
function parseYmd(ymd) {
  if (!ymd) return null;
  if (ymd.includes("T")) return new Date(ymd);
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}
const fmtDate = (s) =>
  s ? new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(parseYmd(s)) : "—";
const yn = (v) => (v === true ? "Yes" : v === false ? "No" : "—");
const fullName = (p) => (p ? `${p.firstName ?? ""} ${p.lastName ?? ""}`.trim() : "");

/** tokens → human label (used for self-assessment checkbox groups saved as sanitized keys) */
const desanitize = (k = "") =>
  k
    .replace(/_/g, " ")
    .replace(/\s+/g, " ")
    .replace(/\bIi\b/g, "II")
    .replace(/\bIii\b/g, "III")
    .trim();

/** Render a value that might be an array/string as chips */
function BadgeList({ items }) {
  if (!items || (Array.isArray(items) && items.length === 0)) return <span>—</span>;
  const arr =
    Array.isArray(items)
      ? items
      : typeof items === "string"
        ? items.split(/[;,]\s*|\s{2,}/).filter(Boolean)
        : [String(items)];
  return (
    <div className="flex flex-wrap gap-2">
      {arr.map((it, i) => (
        <span
          key={`${it}-${i}`}
          className="inline-flex items-center rounded-full bg-purple-50 text-brandLavender border border-brandLavender/30 px-2 py-0.5 text-xs"
        >
          {it}
        </span>
      ))}
    </div>
  );
}

/* ---------- small read-only UI primitives ---------- */
function SectionCard({ title, children, className = "" }) {
  return (
    <section className={`bg-white rounded-xl shadow-md p-5 space-y-4 print-avoid-break ${className}`}>
      <h3 className="font-semibold text-brandLavender">{title}</h3>
      {children}
    </section>
  );
}

function ReadOnlyField({ label, value, children }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
      <div className="border rounded-md px-3 py-2 min-h-[40px] text-sm bg-gray-50">
        {children ?? (value || "—")}
      </div>
    </div>
  );
}

function ReadOnlyArea({ label, value }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
      <div className="border rounded-md px-3 py-2 min-h-[64px] whitespace-pre-wrap text-sm bg-gray-50">
        {value || "—"}
      </div>
    </div>
  );
}

function CheckboxGrid({ title, items }) {
  return (
    <div>
      <div className="block text-xs font-medium text-gray-500 mb-2">{title}</div>
      <div className="grid sm:grid-cols-2 gap-2">
        {items.map(({ label, checked }, i) => (
          <label
            key={`${label}-${i}`}
            className={`flex items-center gap-2 rounded-md border px-3 py-2 text-sm ${checked ? "bg-green-50 border-green-200" : "bg-gray-50 border-gray-200"
              }`}
          >
            <input type="checkbox" checked={!!checked} readOnly className="accent-brandLavender" />
            <span>{label}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

/* ---------- constants mirroring your entry forms ---------- */
const HEALTH_HISTORY_FIELDS = [
  { key: "brokenBones", label: "Broken/Dislocated bones" },
  { key: "muscleStrain", label: "Muscle strain/sprain" },
  { key: "arthritisBursitis", label: "Arthritis/Bursitis" },
  { key: "discProblems", label: "Disc problems" },
  { key: "scoliosis", label: "Scoliosis" },
  { key: "backProblems", label: "Back problems" },
  { key: "osteoporosis", label: "Osteoporosis" },
  { key: "diabetes", label: "Diabetes (type 1 or 2)" },
  { key: "bloodPressure", label: "High/Low blood pressure" },
  { key: "insomnia", label: "Insomnia" },
  { key: "anxietyDepression", label: "Anxiety/Depression" },
  { key: "asthma", label: "Asthma / Short breath" },
  { key: "numbnessTingling", label: "Numbness / Tingling" },
  { key: "cancer", label: "Cancer" },
  { key: "seizures", label: "Seizures" },
  { key: "stroke", label: "Stroke" },
  { key: "heartConditions", label: "Heart conditions / Chest pain" },
  { key: "pregnancy", label: "Pregnancy" },
  { key: "autoimmune", label: "Auto-immune condition" },
  { key: "surgery", label: "Surgery" },
];

/** Self-assessment prompts from your form */
const SA_PROMPTS = [
  "How did the client(s) react to the tools presented?",
  "How did the client(s) react to you?",
  "How did you respond to the client(s)?",
  "What adaptations and/or modifications did you utilize?",
  "What are the next steps for the client(s) work with you (based on direct feedback and your observations)?",
  "What were your biggest wins of this session?",
  "What were your biggest lessons learned?",
  "What, if any, guidance do you need from your mentor?",
];

const TYPE_META = {
  soap: { label: "SOAP Note", endpoint: "soap-notes" },
  self: { label: "Self Assessment", endpoint: "self-assessments" },
  intake: { label: "Intake Form", endpoint: "intakes" },
};

export default function NoteViewer() {
  const router = useRouter();
  const { type, id } = router.query;
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const token =
    typeof window !== "undefined" ? localStorage.getItem("pies-token") : null;

  const meta = useMemo(() => TYPE_META[(type || "").toLowerCase()], [type]);

  useEffect(() => {
    if (!router.isReady || !meta || !id || !token) return;
    (async () => {
      setLoading(true);
      setErr("");
      try {
        const res = await fetch(`${API_BASE_URL}/${meta.endpoint}/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error(`Failed to load ${meta.label.toLowerCase()}`);
        setData(await res.json());
      } catch (e) {
        console.error(e);
        setErr(e.message || "Error loading form");
      } finally {
        setLoading(false);
      }
    })();
  }, [router.isReady, meta, id, token]);

  const patient = data?.patient;
  const therapist = data?.therapist;

  /* ----------- SELF-ASSESSMENT: parse saved JSON "notes" safely ----------- */
  const notesJson = useMemo(() => {
    if (!data || !data.notes) return null;
    try {
      const parsed = typeof data.notes === "string" ? JSON.parse(data.notes) : data.notes;
      return parsed && typeof parsed === "object" ? parsed : null;
    } catch {
      return null;
    }
  }, [data]);

  // Extract selected items from a checkbox group object (truthy keys)
  const pickSelected = (obj) =>
    obj && typeof obj === "object"
      ? Object.entries(obj)
        .filter(([, v]) => !!v)
        .map(([k]) => desanitize(k))
      : [];

  return (
    <div className="max-w-4xl mx-auto py-8 space-y-6">
      {/* header (hidden on print) */}
      <div className="flex items-center justify-between no-print">
        <h2 className="text-2xl font-semibold text-brandLavender">
          {meta ? meta.label : "Form"}
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="px-3 py-1.5 rounded border text-sm hover:bg-gray-50"
          >
            Print
          </button>
          <Link href="/notes" className="px-3 py-1.5 rounded bg-brandLavender text-white text-sm">
            Back to notes
          </Link>
        </div>
      </div>

      {loading && <p className="text-gray-500">Loading…</p>}
      {err && !loading && <p className="text-red-600">{err}</p>}

      {/* ---------- PRINTABLE AREA ---------- */}
      {!loading && !err && data && (
        <div id="print-area" className="space-y-6">
          {/* Summary */}
          <SectionCard title="Summary">
            <div className="grid sm:grid-cols-2 gap-4">
              <ReadOnlyField label="Patient" value={fullName(patient) || `#${patient?.id ?? ""}`} />
              <ReadOnlyField label="Therapist" value={fullName(therapist) || `#${therapist?.id ?? ""}`} />
              <ReadOnlyField label="Date" value={
                fmtDate(
                  data.dateOfSession ||
                  data.dateSubmitted ||
                  data.lastPracticedDate ||
                  patient?.dateCreated
                )
              } />
              <ReadOnlyField label="Record ID" value={data.id} />
            </div>
          </SectionCard>

          {/* ============= SOAP (read-only form look) ============= */}
          {type?.toLowerCase() === "soap" && (
            <>
              <SectionCard title="Session Details">
                <div className="grid sm:grid-cols-2 gap-4">
                  <ReadOnlyField label="Date of Session" value={fmtDate(data.dateOfSession)} />
                  <ReadOnlyField label="Time of Session" value={data.timeOfSession || "—"} />
                  <ReadOnlyField label="Session Length" value={data.sessionLength || "—"} />
                  <ReadOnlyField label="Type of Session" value={data.typeOfSession || "—"} />
                </div>
              </SectionCard>

              <SectionCard title="Client Meta">
                <div className="grid sm:grid-cols-2 gap-4">
                  <ReadOnlyField label="Age" value={data.age ?? "—"} />
                  <ReadOnlyField label="Activity Level" value={data.activityLevel || "—"} />
                  <ReadOnlyArea label="Conditions" value={data.conditions} />
                  <ReadOnlyArea label="History of Conditions" value={data.historyOfConditions} />
                  <ReadOnlyArea label="Medications" value={data.medications} />
                  <ReadOnlyArea label="Goals" value={data.goals} />
                  <ReadOnlyArea label="Diet" value={data.diet} />
                  <ReadOnlyArea label="Quick Notes" value={data.quickNotes} />
                </div>
              </SectionCard>

              <SectionCard title="SOAP Blocks">
                <div className="grid gap-4">
                  <ReadOnlyArea label="Subjective (S)" value={data.snotes} />
                  <ReadOnlyArea label="Objective (O)" value={data.onotes} />
                  <ReadOnlyArea label="Assessment (A)" value={data.anotes} />
                  <ReadOnlyArea label="Plan (P)" value={data.pnotes} />
                </div>
              </SectionCard>
            </>
          )}

          {/* ============= SELF-ASSESSMENT (reconstruct form) ============= */}
          {type?.toLowerCase() === "self" && (
            <>
              <SectionCard title="Session">
                <div className="grid sm:grid-cols-2 gap-4">
                  <ReadOnlyField label="Date of Session" value={fmtDate(data.dateOfSession)} />
                  <ReadOnlyArea label="Goal of Session" value={data.goalOfSession} />
                </div>
              </SectionCard>

              <SectionCard title="Assessment Prompts">
                <div className="grid gap-4">
                  {SA_PROMPTS.map((label, i) => (
                    <ReadOnlyArea key={i} label={label} value={notesJson ? notesJson[`q${i}`] : "—"} />
                  ))}
                </div>
              </SectionCard>

              <SectionCard title="Focus Areas">
                <div className="grid sm:grid-cols-2 gap-4">
                  <ReadOnlyField label="Koshas">
                    <BadgeList items={pickSelected(notesJson?.koshas)} />
                  </ReadOnlyField>
                  <ReadOnlyField label="Asana">
                    <BadgeList items={pickSelected(notesJson?.asana)} />
                  </ReadOnlyField>
                  <ReadOnlyField label="Mindfulness">
                    <BadgeList items={pickSelected(notesJson?.mindfulness)} />
                  </ReadOnlyField>
                  <ReadOnlyField label="Kleshas">
                    <BadgeList items={pickSelected(notesJson?.kleshas)} />
                  </ReadOnlyField>
                  <ReadOnlyField label="Chakras">
                    <BadgeList items={pickSelected(notesJson?.chakras)} />
                  </ReadOnlyField>
                  <ReadOnlyField label="Pranayama">
                    <BadgeList items={pickSelected(notesJson?.pranayama)} />
                  </ReadOnlyField>
                  <ReadOnlyField label="Other Mindfulness" value={notesJson?.otherMindfulness || "—"} />
                  <ReadOnlyField label="Other Pranayama" value={notesJson?.otherPranayama || "—"} />
                </div>
              </SectionCard>

              <SectionCard title="Freeform Notes">
                <ReadOnlyArea label="Assessment Summary" value={data.assessment} />
                {!notesJson && (
                  <ReadOnlyArea
                    label="Raw Notes"
                    value={typeof data.notes === "string" ? data.notes : JSON.stringify(data.notes)}
                  />
                )}
              </SectionCard>
            </>
          )}

          {/* ============= INTAKE (read-only form) ============= */}
          {type?.toLowerCase() === "intake" && (
            <>
              <SectionCard title="Confidential Information">
                <div className="grid sm:grid-cols-2 gap-4">
                  <ReadOnlyField label="First Name" value={patient?.firstName} />
                  <ReadOnlyField label="Last Name" value={patient?.lastName} />
                  <ReadOnlyField label="Date of Birth" value={fmtDate(patient?.dateOfBirth)} />
                  <ReadOnlyField label="Email" value={patient?.email} />
                  <ReadOnlyField label="Address" value={patient?.address} />
                  <ReadOnlyField label="City" value={patient?.city} />
                  <ReadOnlyField label="State" value={patient?.state} />
                  <ReadOnlyField label="Zip Code" value={patient?.zipCode} />
                  <ReadOnlyField label="Home Phone" value={patient?.homePhoneNumber} />
                  <ReadOnlyField label="Cell Phone" value={patient?.cellPhoneNumber} />
                  <ReadOnlyField label="Work Phone" value={patient?.workPhoneNumber} />
                  <ReadOnlyField label="Emergency Contact" value={patient?.emergencyContactName} />
                  <ReadOnlyField label="Emergency Phone" value={patient?.emergencyContactPhone} />
                  <ReadOnlyField label="Referred By" value={patient?.referredBy} />
                </div>
              </SectionCard>

              <SectionCard title="Yoga Experience & Goals">
                <div className="grid sm:grid-cols-2 gap-4">
                  <ReadOnlyField label="Practiced Yoga Before" value={yn(data.practicedYogaBefore)} />
                  <ReadOnlyField label="Last Practiced" value={fmtDate(data.lastPracticedDate)} />
                  <ReadOnlyField label="Frequency" value={data.yogaFrequency || "—"} />
                  <ReadOnlyField label="Styles">
                    <BadgeList items={data.yogaStyles} />
                  </ReadOnlyField>
                  <ReadOnlyField label="Goals">
                    <BadgeList items={data.yogaGoals} />
                  </ReadOnlyField>
                  <ReadOnlyField label="Interests">
                    <BadgeList items={data.yogaInterests} />
                  </ReadOnlyField>
                  <ReadOnlyArea label="Goals Explanation" value={data.yogaGoalsExplanation} />
                </div>
              </SectionCard>

              <SectionCard title="Lifestyle & Fitness">
                <div className="grid sm:grid-cols-2 gap-4">
                  <ReadOnlyField label="Activity Level" value={data.activityLevel} />
                  <ReadOnlyField label="Stress Level" value={data.stressLevel ?? "—"} />
                </div>
              </SectionCard>

              <SectionCard title="Health History">
                <CheckboxGrid
                  title="Conditions"
                  items={HEALTH_HISTORY_FIELDS.map(({ key, label }) => ({
                    label,
                    checked: data.healthHistory ? !!data.healthHistory[key] : false,
                  }))}
                />
                <div className="grid sm:grid-cols-2 gap-4 mt-4">
                  <ReadOnlyArea
                    label="Medications"
                    value={
                      data.healthHistory?.medications
                        ? data.healthHistory?.medicationsList || "Yes (unspecified)"
                        : data.healthHistory
                          ? "No"
                          : "—"
                    }
                  />
                  <ReadOnlyArea
                    label="Additional Notes"
                    value={data.healthHistory?.additionalNotes}
                  />
                  {data.healthHistory?.pregnancyEdd && (
                    <ReadOnlyField
                      label="Pregnancy EDD"
                      value={fmtDate(data.healthHistory.pregnancyEdd)}
                    />
                  )}
                  <ReadOnlyArea
                    label="Other / Explain"
                    value={data.healthHistory?.otherConditionsExplanation}
                  />
                </div>
              </SectionCard>
            </>
          )}
        </div>
      )}

      {/* Print styles */}
      <style jsx global>{`
        @media print {
          /* hide everything by default */
          body * { visibility: hidden !important; }
          /* show only the printable area */
          #print-area, #print-area * { visibility: visible !important; }
          #print-area {
            position: absolute;
            left: 0; top: 0;
            width: 100%;
            margin: 0; padding: 0;
          }
          /* remove UI-only pieces */
          .no-print { display: none !important; }
          /* cleaner output */
          .shadow, .shadow-md, .shadow-lg, .shadow-xl, .shadow-2xl { box-shadow: none !important; }
          .bg-white { background: #fff !important; }
          /* avoid awkward page breaks within cards/sections */
          .print-avoid-break { break-inside: avoid; page-break-inside: avoid; }
        }
      `}</style>
    </div>
  );
}
