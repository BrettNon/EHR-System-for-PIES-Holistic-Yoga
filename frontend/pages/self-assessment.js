import { useForm } from "react-hook-form";
import { TextInput } from "../components/TextInput";
import { CheckBoxGroup } from "../components/CheckBoxGroup";
import { SignaturePadField } from "../components/SignaturePadField";

// Helper data arrays used by multiple forms
const yogaStyles = [
  "Hatha",
  "Ashtanga",
  "Vinyasa/Flow",
  "Iyengar",
  "Power",
  "Anusara",
  "Bikram/Hot",
  "Forrest",
  "Kundalini",
  "Gentle",
  "Restorative",
  "Yin",
];

const activityLevels = [
  "Sedentary/Very inactive",
  "Somewhat inactive",
  "Average",
  "Somewhat active",
  "Extremely active",
];

const physicalHistoryConditions = [
  "Broken/Dislocated bones",
  "Muscle strain/sprain",
  "Arthritis/Bursitis",
  "Disc problems",
  "Scoliosis",
  "Back problems",
  "Osteoporosis",
  "Diabetes type 1 or 2",
  "High/Low blood pressure",
  "Insomnia",
  "Anxiety/Depression",
  "Asthma / Short breath",
  "Numbness / Tingling",
  "Cancer",
  "Seizures",
  "Stroke",
  "Heart conditions / Chest pain",
  "Pregnancy",
  "Auto‑immune condition",
  "Surgery",
];

export function SelfAssessmentPage() {
  const { register, handleSubmit } = useForm();
  const onSubmit = (d) => {
    console.log("Self‑Assessment", d);
    alert("Saved to console");
  };

  const koshas = ["Physical", "Intellectual", "Emotional", "Spiritual"];
  const asana = [
    "Sun A", "Sun B", "Seated", "Standing", "Prone", "Supine", "Balance", "Revolved", "Backbends", "Inversion",
  ];
  const mindfulness = [
    "Guided Visualization", "Breath‑centered", "Internal Observation", "External Observation", "Non‑judgement", "Other",
  ];
  const kleshas = ["Ignorance", "Egoism", "Attachment", "Aversion", "Fear of Loss"];
  const chakras = [
    "Root", "Sacral", "Solar Plexus", "Heart", "Throat", "Third‑Eye", "Crown",
  ];
  const pranayama = [
    "Diaphragmatic", "Three‑Part", "Retention", "Suspension", "Victorious", "Alternate Nostril", "Other",
  ];

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-4xl mx-auto">
      {/* Open‑ended questions */}
      {[
        "How did the client(s) react to the tools presented?",
        "How did the client(s) react to you?",
        "How did you respond to the client(s)?",
        "What adaptations and/or modifications did you utilize?",
        "What are the next steps for the client(s) work with you (based on direct feedback and your observations)?",
        "What were your biggest wins of this session?",
        "What were your biggest lessons learned?",
        "What, if any, guidance do you need from your mentor?",
      ].map((q, i) => (
        <div key={i}>
          <label className="block font-medium mb-1">{q}</label>
          <textarea {...register(`q${i}`)} rows="3" className="w-full border rounded p-2" />
        </div>
      ))}

      {/* Checkbox groups */}
      <CheckBoxGroup title="Koshas" namePrefix="koshas" options={koshas} register={register} />
      <CheckBoxGroup title="Asana" namePrefix="asana" options={asana} register={register} />
      <CheckBoxGroup title="Mindfulness" namePrefix="mindfulness" options={mindfulness} register={register} />
      <CheckBoxGroup title="Kleshas" namePrefix="kleshas" options={kleshas} register={register} />
      <CheckBoxGroup title="Chakras" namePrefix="chakras" options={chakras} register={register} />
      <CheckBoxGroup title="Pranayama" namePrefix="pranayama" options={pranayama} register={register} />

      {/* other free‑text fields for 'Other' selections */}
      <TextInput label="Other Mindfulness" name="otherMindfulness" register={register} />
      <TextInput label="Other Pranayama" name="otherPranayama" register={register} />

      <button type="submit" className="bg-brandLavender text-white px-6 py-2 rounded">Save</button>
    </form>
  );
}

export default SelfAssessmentPage; 