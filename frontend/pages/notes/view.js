// pages/notes/view.js
import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

/* helpers */
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

const TYPE_META = {
  soap:   { label: "SOAP Note",        endpoint: "soap-notes" },
  self:   { label: "Self Assessment",  endpoint: "self-assessments" },
  intake: { label: "Intake Form",      endpoint: "intakes" },
};

function Section({ title, children }) {
  return (
    <section className="bg-white rounded-xl shadow-md p-5 space-y-3 print-avoid-break">
      <h3 className="font-semibold text-brandLavender">{title}</h3>
      {children}
    </section>
  );
}
function KV({ label, children }) {
  return (
    <div className="grid grid-cols-[10rem,1fr] gap-3">
      <div className="text-sm text-gray-600">{label}</div>
      <div className="text-sm text-gray-900">{children ?? "—"}</div>
    </div>
  );
}

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
        const res = await fetch(`http://localhost:8080/${meta.endpoint}/${id}`, {
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
          <Section title="Summary">
            <div className="grid sm:grid-cols-2 gap-4">
              <KV label="Patient">{fullName(patient) || `#${patient?.id ?? ""}`}</KV>
              <KV label="Therapist">{fullName(therapist) || `#${therapist?.id ?? ""}`}</KV>
              <KV label="Date">
                {fmtDate(
                  data.dateOfSession ||
                    data.dateSubmitted ||
                    data.lastPracticedDate ||
                    patient?.dateCreated
                )}
              </KV>
              <KV label="Record ID">{data.id}</KV>
            </div>
          </Section>

          {/* Type-specific rendering */}
          {type?.toLowerCase() === "soap" && (
            <>
              <Section title="Session">
                <div className="space-y-2">
                  <KV label="Date">{fmtDate(data.dateOfSession)}</KV>
                  <KV label="Time">{data.timeOfSession || "—"}</KV>
                  <KV label="Length">{data.sessionLength || "—"}</KV>
                  <KV label="Type">{data.typeOfSession || "—"}</KV>
                </div>
              </Section>

              <Section title="Details">
                <div className="space-y-2">
                  <KV label="Conditions">{data.conditions}</KV>
                  <KV label="Medications">{data.medications}</KV>
                  <KV label="Medication Note">{data.medicationNote}</KV>
                  <KV label="Goals">{data.goals}</KV>
                  <KV label="Diet">{data.diet}</KV>
                  <KV label="Activity Level">{data.activityLevel}</KV>
                  <KV label="History of Conditions">{data.historyOfConditions}</KV>
                  <KV label="Quick Notes">{data.quickNotes}</KV>
                </div>
              </Section>

              <Section title="SOAP">
                <div className="space-y-2">
                  <KV label="Subjective">{data.snotes}</KV>
                  <KV label="Objective">{data.onotes}</KV>
                  <KV label="Assessment">{data.anotes}</KV>
                  <KV label="Plan">{data.pnotes}</KV>
                </div>
              </Section>
            </>
          )}

          {type?.toLowerCase() === "self" && (
            <>
              <Section title="Session">
                <div className="space-y-2">
                  <KV label="Date">{fmtDate(data.dateOfSession)}</KV>
                  <KV label="Goal of Session">{data.goalOfSession}</KV>
                </div>
              </Section>
              <Section title="Assessment">
                <div className="space-y-2">
                  <KV label="Assessment">{data.assessment}</KV>
                  <KV label="Notes">{data.notes}</KV>
                </div>
              </Section>
            </>
          )}

          {type?.toLowerCase() === "intake" && (
            <>
              <Section title="Intake">
                <div className="space-y-2">
                  <KV label="Date Submitted">{fmtDate(data.dateSubmitted)}</KV>
                  <KV label="Practiced Yoga Before">{yn(data.practicedYogaBefore)}</KV>
                  <KV label="Last Practiced">{fmtDate(data.lastPracticedDate)}</KV>
                  <KV label="Frequency">{data.yogaFrequency}</KV>
                  <KV label="Styles">{data.yogaStyles}</KV>
                  <KV label="Other Style">{data.yogaStyleOther}</KV>
                  <KV label="Goals">{data.yogaGoals}</KV>
                  <KV label="Other Goals">{data.yogaGoalsOther}</KV>
                  <KV label="Goals Explanation">{data.yogaGoalsExplanation}</KV>
                  <KV label="Interests">{data.yogaInterests}</KV>
                  <KV label="Other Interests">{data.yogaInterestsOther}</KV>
                  <KV label="Activity Level">{data.activityLevel}</KV>
                  <KV label="Stress Level">{data.stressLevel ?? "—"}</KV>
                </div>
              </Section>

              <Section title="Health History">
                <div className="grid sm:grid-cols-2 gap-2">
                  {data.healthHistory ? (
                    <>
                      <KV label="Anxiety/Depression">{yn(data.healthHistory.anxietyDepression)}</KV>
                      <KV label="Arthritis/Bursitis">{yn(data.healthHistory.arthritisBursitis)}</KV>
                      <KV label="Asthma">{yn(data.healthHistory.asthma)}</KV>
                      <KV label="Autoimmune">{yn(data.healthHistory.autoimmune)}</KV>
                      <KV label="Back Problems">{yn(data.healthHistory.backProblems)}</KV>
                      <KV label="Blood Pressure">{yn(data.healthHistory.bloodPressure)}</KV>
                      <KV label="Broken Bones">{yn(data.healthHistory.brokenBones)}</KV>
                      <KV label="Cancer">{yn(data.healthHistory.cancer)}</KV>
                      <KV label="Diabetes">{yn(data.healthHistory.diabetes)}</KV>
                      <KV label="Disc Problems">{yn(data.healthHistory.discProblems)}</KV>
                      <KV label="Heart Conditions">{yn(data.healthHistory.heartConditions)}</KV>
                      <KV label="Insomnia">{yn(data.healthHistory.insomnia)}</KV>
                      <KV label="Muscle Strain">{yn(data.healthHistory.muscleStrain)}</KV>
                      <KV label="Numbness/Tingling">{yn(data.healthHistory.numbnessTingling)}</KV>
                      <KV label="Osteoporosis">{yn(data.healthHistory.osteoporosis)}</KV>
                      <KV label="Pregnancy">{yn(data.healthHistory.pregnancy)}</KV>
                      <KV label="Scoliosis">{yn(data.healthHistory.scoliosis)}</KV>
                      <KV label="Seizures">{yn(data.healthHistory.seizures)}</KV>
                      <KV label="Stroke">{yn(data.healthHistory.stroke)}</KV>
                      <KV label="Surgery">{yn(data.healthHistory.surgery)}</KV>
                      <KV label="Medications">{yn(data.healthHistory.medications)}</KV>
                      <KV label="Medications List">{data.healthHistory.medicationsList}</KV>
                      <KV label="Additional Notes">{data.healthHistory.additionalNotes}</KV>
                    </>
                  ) : (
                    <div className="text-sm text-gray-600">No health history provided.</div>
                  )}
                </div>
              </Section>
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
