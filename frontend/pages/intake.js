// pages/intake.js
import { useForm } from "react-hook-form";
import { TextInput } from "../components/TextInput";
import { CheckBoxGroup } from "../components/CheckBoxGroup";
import { SignaturePadField } from "../components/SignaturePadField";
import { useState, useEffect, useMemo } from "react";
import { apiFetch } from "../utils/api";
import { API_BASE_URL } from "../utils/config";

/** 50 U.S. states (two-letter codes) */
const US_STATES = [
  { abbr: "AL", name: "Alabama" }, { abbr: "AK", name: "Alaska" },
  { abbr: "AZ", name: "Arizona" }, { abbr: "AR", name: "Arkansas" },
  { abbr: "CA", name: "California" }, { abbr: "CO", name: "Colorado" },
  { abbr: "CT", name: "Connecticut" }, { abbr: "DE", name: "Delaware" },
  { abbr: "FL", name: "Florida" }, { abbr: "GA", name: "Georgia" },
  { abbr: "HI", name: "Hawaii" }, { abbr: "ID", name: "Idaho" },
  { abbr: "IL", name: "Illinois" }, { abbr: "IN", name: "Indiana" },
  { abbr: "IA", name: "Iowa" }, { abbr: "KS", name: "Kansas" },
  { abbr: "KY", name: "Kentucky" }, { abbr: "LA", name: "Louisiana" },
  { abbr: "ME", name: "Maine" }, { abbr: "MD", name: "Maryland" },
  { abbr: "MA", name: "Massachusetts" }, { abbr: "MI", name: "Michigan" },
  { abbr: "MN", name: "Minnesota" }, { abbr: "MS", name: "Mississippi" },
  { abbr: "MO", name: "Missouri" }, { abbr: "MT", name: "Montana" },
  { abbr: "NE", name: "Nebraska" }, { abbr: "NV", name: "Nevada" },
  { abbr: "NH", name: "New Hampshire" }, { abbr: "NJ", name: "New Jersey" },
  { abbr: "NM", name: "New Mexico" }, { abbr: "NY", name: "New York" },
  { abbr: "NC", name: "North Carolina" }, { abbr: "ND", name: "North Dakota" },
  { abbr: "OH", name: "Ohio" }, { abbr: "OK", name: "Oklahoma" },
  { abbr: "OR", name: "Oregon" }, { abbr: "PA", name: "Pennsylvania" },
  { abbr: "RI", name: "Rhode Island" }, { abbr: "SC", name: "South Carolina" },
  { abbr: "SD", name: "South Dakota" }, { abbr: "TN", name: "Tennessee" },
  { abbr: "TX", name: "Texas" }, { abbr: "UT", name: "Utah" },
  { abbr: "VT", name: "Vermont" }, { abbr: "VA", name: "Virginia" },
  { abbr: "WA", name: "Washington" }, { abbr: "WV", name: "West Virginia" },
  { abbr: "WI", name: "Wisconsin" }, { abbr: "WY", name: "Wyoming" },
];

const yogaStyles = [
  "Hatha", "Ashtanga", "Vinyasa/Flow", "Iyengar", "Power", "Anusara",
  "Bikram/Hot", "Forrest", "Kundalini", "Gentle", "Restorative", "Yin"
];

const activityLevels = [
  "Sedentary/Very inactive", "Somewhat inactive", "Average",
  "Somewhat active", "Extremely active"
];

const physicalHistoryOptions = [
  { label: "Broken/Dislocated bones", key: "brokenBones" },
  { label: "Muscle strain/sprain", key: "muscleStrain" },
  { label: "Arthritis/Bursitis", key: "arthritisBursitis" },
  { label: "Disc problems", key: "discProblems" },
  { label: "Scoliosis", key: "scoliosis" },
  { label: "Back problems", key: "backProblems" },
  { label: "Osteoporosis", key: "osteoporosis" },
  { label: "Diabetes (type 1 or 2)", key: "diabetes" },
  { label: "High/Low blood pressure", key: "bloodPressure" },
  { label: "Insomnia", key: "insomnia" },
  { label: "Anxiety/Depression", key: "anxietyDepression" },
  { label: "Asthma / Short breath", key: "asthma" },
  { label: "Numbness / Tingling", key: "numbnessTingling" },
  { label: "Cancer", key: "cancer" },
  { label: "Seizures", key: "seizures" },
  { label: "Stroke", key: "stroke" },
  { label: "Heart conditions / Chest pain", key: "heartConditions" },
  { label: "Pregnancy", key: "pregnancy" },
  { label: "Auto-immune condition", key: "autoimmune" },
  { label: "Surgery", key: "surgery" },
  { label: "Medications", key: "medications" }
];

// same helper used elsewhere
const sanitizeKey = (str) => str.replace(/[^a-zA-Z0-9]/g, "_");

// ===== formatting + validation helpers =====
const MAX = {
  firstName: 100,
  lastName: 100,
  address: 255,
  city: 100,
  emergencyContactName: 100,
};

const MAX_NOTE = 255;

const digitsOnly = (s = "") => s.replace(/\D/g, "");
const formatUSPhone = (s = "") => {
  const d = digitsOnly(s).slice(0, 10);
  if (d.length < 4) return d;
  if (d.length < 7) return `(${d.slice(0, 3)}) ${d.slice(3)}`;
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
};

function FieldCount({ value, max }) {
  const count = value?.length ?? 0;
  const over = count > max;
  return (
    <div className={`text-xs text-right mt-1 ${over ? "text-red-600" : "text-gray-400"}`}>
      {count} / {max}
    </div>
  );
}

export default function IntakeFormPage() {
  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    getValues,
    formState: { errors, isValid },
  } = useForm({ mode: "onChange" });

  const [therapists, setTherapists] = useState([]);

  // NEW: patient search + selection
  const [patients, setPatients] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [openList, setOpenList] = useState(false);

  // NOTE: computed flag to distinguish existing vs new client
  const isExisting = !!selectedPatient;

  const practicedBefore = watch("practicedBefore");
  const todayYmd = new Date().toISOString().split("T")[0];

  const myTherapistId =
    typeof window !== "undefined" ? String(localStorage.getItem("therapistId") || "") : "";

  // Load therapists
  useEffect(() => {
    (async () => {
      try {
        const res = await apiFetch(`${API_BASE_URL}/therapists/active`);
        if (!res.ok) throw new Error("Failed to load therapists");
        const data = await res.json();
        setTherapists(data || []);
      } catch (err) {
        console.error("Error loading therapists:", err);
      }
    })();
  }, []);

  // Prefill intake's therapistId with current therapist (hidden input)
  // NOTE (updated): only apply when NOT using an existing client; otherwise a later effect will set from the selected patient.
  useEffect(() => {
    if (!isExisting && myTherapistId) {
      setValue("therapistId", Number(myTherapistId), { shouldValidate: true });
    }
  }, [myTherapistId, setValue, isExisting]);

  // When creating a NEW client, default the "Assign Therapist" to me (or first therapist)
  // NOTE (updated): use the single field "therapistId" instead of a separate newClientTherapistId.
  useEffect(() => {
    if (isExisting) return; // don't touch when existing client is selected
    const mine = therapists.find((t) => String(t.id) === String(myTherapistId));
    const fallback = therapists[0]?.id;
    if (mine?.id) setValue("therapistId", Number(mine.id), { shouldValidate: true });
    else if (fallback) setValue("therapistId", Number(fallback), { shouldValidate: true });
  }, [therapists, myTherapistId, isExisting, setValue]);

  // Load patients (you can swap this to a server-side search later)
  useEffect(() => {
    (async () => {
      try {
        const res = await apiFetch(`${API_BASE_URL}/patients?page=0&size=500`);
        if (!res.ok) throw new Error("Failed to load patients");
        const page = await res.json();
        setPatients(page.content || []);
      } catch (err) {
        console.error("Error loading patients:", err);
      }
    })();
  }, []);

  // When a patient is picked, prefill + lock profile fields (edits belong on the profile page)
  useEffect(() => {
    if (!selectedPatient) return;
    const p = selectedPatient;
    setValue("firstName", p.firstName || "");
    setValue("lastName", p.lastName || "");
    setValue("dob", p.dateOfBirth || "");
    setValue("address", p.address || "");
    setValue("city", p.city || "");
    setValue("state", p.state || "");
    setValue("zipCode", p.zipCode || "");
    setValue("email", p.email || "");
    setValue("homePhone", p.homePhoneNumber ? formatUSPhone(p.homePhoneNumber) : "");
    setValue("cellPhone", p.cellPhoneNumber ? formatUSPhone(p.cellPhoneNumber) : "");
    setValue("workPhone", p.workPhoneNumber ? formatUSPhone(p.workPhoneNumber) : "");
    setValue("emergencyContactName", p.emergencyContactName || "");
    setValue("emergencyContactPhone", p.emergencyContactPhone ? formatUSPhone(p.emergencyContactPhone) : "");
    setValue("referredBy", p.referredBy || "");
  }, [selectedPatient, setValue]);

  // NOTE (new): when a patient is picked, set therapistId from the patient's assigned therapist (if available).
  // Adjust the property name below to match your backend payload shape.
  useEffect(() => {
    if (!selectedPatient) return;
    const p = selectedPatient;
    const assigned =
      p.therapistId ??
      p.primaryTherapistId ??
      (p.therapist && p.therapist.id) ??
      null;

    if (assigned) {
      setValue("therapistId", Number(assigned), { shouldValidate: true });
    } else if (myTherapistId) {
      setValue("therapistId", Number(myTherapistId), { shouldValidate: true });
    }
  }, [selectedPatient, myTherapistId, setValue]);

  // Suggestions
  const suggestions = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return [];
    return patients
      .filter((p) => {
        const name = `${p.firstName ?? ""} ${p.lastName ?? ""}`.toLowerCase();
        return name.includes(q);
      })
      .slice(0, 10);
  }, [patients, search]);

  // ===== submit =====
  const onSubmit = async (data) => {
    const today = todayYmd;

    const getSelectedOptions = (prefix, options) =>
      options
        .filter((opt) => {
          const key = typeof opt === "string" ? sanitizeKey(opt) : opt.key;
          return data[prefix] && data[prefix][key];
        })
        .map((opt) => (typeof opt === "string" ? opt : opt.label));

    const selectedYogaStyles = getSelectedOptions("styles", yogaStyles);

    const selectedYogaGoals = getSelectedOptions("goals", [
      "Improve fitness",
      "Increase well​-being",
      "Injury rehabilitation",
      "Positive reinforcement",
      "Strength training",
      "Weight management",
      "Other",
    ]);
    const selectedYogaInterests = getSelectedOptions("interests", [
      "Asana (postures)",
      "Pranayama (breath work)",
      "Meditation",
      "Yoga Philosophy",
      "Eastern energy systems",
      "Other",
    ]);

    const healthHistory = {};
    physicalHistoryOptions.forEach(({ key }) => {
      healthHistory[key] = data.physicalHistory?.[key] || false;
    });
    healthHistory.medications = !!data.medications;
    healthHistory.medicationsList = data.medications || "";
    healthHistory.additionalNotes = data.additionalDetails || "";
    healthHistory.pregnancyEdd = data.pregnancyEdd || null;
    healthHistory.otherConditionsExplanation = data.otherConditionsExplanation || "";

    // Base payload
    const payload = {
      therapistId: Number.isFinite(data.therapistId) ? data.therapistId : null, // single source of truth for therapist
      intakeDate: today,
      practicedYogaBefore: data.practicedBefore === "yes",
      lastPracticedDate: data.lastPracticeDate || null,
      yogaFrequency: data.practiceFrequency || null,
      yogaStyles: selectedYogaStyles,
      yogaStyleOther: "",
      yogaGoals: selectedYogaGoals,
      yogaGoalsOther: data.goals?.Other || "",
      yogaGoalsExplanation: data.goalExplanation || "",
      yogaInterests: selectedYogaInterests,
      yogaInterestsOther: data.interests?.Other || "",
      activityLevel: data.activityLevel,
      stressLevel: parseInt(data.stressLevel) || 0,
      healthHistory,
    };

    // If user selected an existing client → send patientId, otherwise send patient object with therapist assignment
    payload.patient = selectedPatient?.id
      ? {
        id: selectedPatient.id,
        firstName: selectedPatient.firstName || watch("firstName") || "",
        lastName: selectedPatient.lastName || watch("lastName") || "",
        dateOfBirth: selectedPatient.dateOfBirth || watch("dob") || null,
        address: selectedPatient.address || "",
        city: selectedPatient.city || "",
        state: selectedPatient.state || "", // 2-letter
        zipCode: (selectedPatient.zipCode || "").replace(/\D/g, "").slice(0, 5),
        email: selectedPatient.email || "",
        homePhoneNumber: (selectedPatient.homePhoneNumber || "").replace(/\D/g, "").slice(0, 10),
        cellPhoneNumber: (selectedPatient.cellPhoneNumber || "").replace(/\D/g, "").slice(0, 10),
        workPhoneNumber: (selectedPatient.workPhoneNumber || "").replace(/\D/g, "").slice(0, 10),
        emergencyContactName: selectedPatient.emergencyContactName || "",
        emergencyContactPhone: (selectedPatient.emergencyContactPhone || "").replace(/\D/g, "").slice(0, 10),
        referredBy: selectedPatient.referredBy || "",
        dateCreated: selectedPatient.dateCreated || selectedPatient.createdAt || undefined,
      }
      : {
        firstName: data.firstName || "",
        lastName: data.lastName || "",
        dateOfBirth: data.dob,
        address: data.address,
        city: data.city,
        state: data.state, // two-letter code
        zipCode: (data.zipCode || "").replace(/\D/g, "").slice(0, 5),
        email: data.email,
        homePhoneNumber: (data.homePhone || "").replace(/\D/g, "").slice(0, 10),
        cellPhoneNumber: (data.cellPhone || "").replace(/\D/g, "").slice(0, 10),
        workPhoneNumber: (data.workPhone || "").replace(/\D/g, "").slice(0, 10),
        emergencyContactName: data.emergencyContactName,
        emergencyContactPhone: (data.emergencyContactPhone || "").replace(/\D/g, "").slice(0, 10),
        referredBy: data.referredBy,
        dateCreated: today,
        therapistId: Number.isFinite(data.therapistId) ? data.therapistId : null, // assign the same single field for new client
      };

    // guard: when creating a new client, therapist selection is required
    if (!isExisting && !Number.isFinite(data.therapistId)) {
      alert("Please select a therapist for the new client.");
      return;
    }

    try {
      const res = await apiFetch(`${API_BASE_URL}/intakes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const t = await res.text().catch(() => "");
        throw new Error(t || "Failed to submit intake form");
      }
      alert("Form submitted successfully!");
      setSelectedPatient(null);
      setSearch("");
      reset();
      // keep therapistId set for next intake (defaults to current therapist when no existing client)
      if (myTherapistId) setValue("therapistId", Number(myTherapistId));
    } catch (err) {
      console.error("Submission error:", err);
      alert(err.message || "Error submitting intake form.");
    }
  };

  // Conditional required rules: if an existing client is selected, don't require profile fields here
  const isExistingComputed = isExisting; // alias for clarity

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 max-w-4xl mx-auto">
      {/* hidden intake therapist id (performing therapist) */}
      {/* NOTE (updated): we now render a visible select bound to the same field, so a hidden input is not required. */}

      {/* --- Client picker --- */}
      <div>
        <label className="block text-sm font-medium text-brandLavender mb-1">Client</label>
        {!isExisting && (
          <div className="relative">
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setOpenList(true); }}
              onFocus={() => setOpenList(true)}
              placeholder="Search existing clients by name…"
              className="w-full border rounded p-2"
              aria-autocomplete="list"
              aria-expanded={openList}
            />
            {openList && (suggestions.length > 0 || search.trim()) && (
              <div
                className="absolute z-10 mt-1 w-full bg-white border rounded shadow-md max-h-64 overflow-auto"
                onMouseDown={(e) => e.preventDefault()}
              >
                {suggestions.map((p) => {
                  const name = `${p.firstName ?? ""} ${p.lastName ?? ""}`.trim() || `#${p.id}`;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      className="w-full text-left px-3 py-2 hover:bg-gray-50"
                      onClick={() => { setSelectedPatient(p); setOpenList(false); }}
                    >
                      <div className="font-medium">{name}</div>
                      <div className="text-xs text-gray-500">
                        DOB: {p.dateOfBirth || "—"} • Since: {p.dateCreated || p.createdAt || "—"}
                      </div>
                    </button>
                  );
                })}
                {/* create-new affordance */}
                <div className="border-t" />
                <button
                  type="button"
                  className="w-full text-left px-3 py-2 hover:bg-gray-50 text-brandLavender"
                  onClick={() => {
                    // optionally prefill first/last from what they typed
                    const parts = search.trim().split(/\s+/);
                    setValue("firstName", parts[0] || "");
                    setValue("lastName", parts.slice(1).join(" ") || "");
                    setSelectedPatient(null);
                    setOpenList(false);
                  }}
                >
                  + Create new client{search.trim() ? ` named “${search.trim()}”` : ""}
                </button>
              </div>
            )}
          </div>
        )}

        {isExisting && (
          <div className="flex items-center gap-3 bg-purple-50 border border-purple-200 rounded p-2 mt-1">
            <div className="text-sm">
              Using existing client:{" "}
              <span className="font-medium">
                {(selectedPatient.firstName || "") + " " + (selectedPatient.lastName || "")}
              </span>{" "}
              (#{selectedPatient.id})
            </div>
            <button
              type="button"
              className="ml-auto text-sm underline text-brandLavender"
              onClick={() => { setSelectedPatient(null); setSearch(""); }}
            >
              Clear / New client
            </button>
          </div>
        )}
        <p className="text-xs text-gray-500 mt-1">
          Selecting a client locks profile fields here. To edit profile details, use the client record page.
        </p>
      </div>

      {/* Assign Therapist (always visible) */}
      {/* NOTE (updated): Single field "therapistId". Disabled when existing client is selected. */}
      <div>
        <label className="block font-medium mb-1">
          Assign Therapist {isExisting ? "(from client record)" : "*"}
        </label>
        <select
          className="border rounded p-2 w-full"
          disabled={isExisting} // lock when using an existing client
          {...register("therapistId", {
            required: !isExisting ? "Please select a therapist for the new client" : false,
            valueAsNumber: true, // ensure value is a number in form data
          })}
        >
          {!isExisting && <option value="">— Select therapist —</option>}
          {therapists.map((t) => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>
        {!isExisting && errors.therapistId && (
          <p className="text-red-600 text-xs mt-1">{errors.therapistId.message}</p>
        )}
        <p className="text-xs text-gray-500 mt-1">
          {isExisting
            ? "Taken from the existing client’s assigned therapist."
            : "Required for new client."}
        </p>
      </div>

      {/* --- Personal Info --- */}
      <h2 className="text-xl font-semibold text-brandLavender">Confidential Information</h2>
      <div className="grid md:grid-cols-2 gap-4">
        {/* Required + char counter (conditionally required when creating new) */}
        <div>
          <TextInput
            label="First Name"
            name="firstName"
            register={register}
            required={!isExistingComputed}
            maxLength={MAX.firstName}
            disabled={isExistingComputed}
            {...register("firstName", {
              required: !isExistingComputed ? "First name is required" : false,
              maxLength: { value: MAX.firstName, message: "Too many characters" },
            })}
          />
          <FieldCount value={watch("firstName")} max={MAX.firstName} />
          {errors.firstName && <p className="text-red-600 text-xs mt-1">{errors.firstName.message}</p>}
        </div>

        <div>
          <TextInput
            label="Last Name"
            name="lastName"
            register={register}
            required={!isExistingComputed}
            maxLength={MAX.lastName}
            disabled={isExistingComputed}
            {...register("lastName", {
              required: !isExistingComputed ? "Last name is required" : false,
              maxLength: { value: MAX.lastName, message: "Too many characters" },
            })}
          />
          <FieldCount value={watch("lastName")} max={MAX.lastName} />
          {errors.lastName && <p className="text-red-600 text-xs mt-1">{errors.lastName.message}</p>}
        </div>

        <TextInput
          label="Date of Birth"
          name="dob"
          type="date"
          register={register}
          required={!isExistingComputed}
          disabled={isExistingComputed}
          {...register("dob", {
            required: !isExistingComputed ? "Date of birth is required" : false,
            validate: (v) => (!v || v <= todayYmd) || "DOB cannot be in the future",
          })}
        />

        {/* Address + char counter */}
        <div className="md:col-span-2">
          <TextInput
            label="Address"
            name="address"
            register={register}
            required={!isExistingComputed}
            maxLength={MAX.address}
            className="w-full"
            disabled={isExistingComputed}
            {...register("address", {
              required: !isExistingComputed ? "Address is required" : false,
              maxLength: { value: MAX.address, message: "Too many characters" },
            })}
          />
          <FieldCount value={watch("address")} max={MAX.address} />
          {errors.address && <p className="text-red-600 text-xs mt-1">{errors.address.message}</p>}
        </div>

        {/* City + char counter */}
        <div>
          <TextInput
            label="City"
            name="city"
            register={register}
            required={!isExistingComputed}
            maxLength={MAX.city}
            disabled={isExistingComputed}
            {...register("city", {
              required: !isExistingComputed ? "City is required" : false,
              maxLength: { value: MAX.city, message: "Too many characters" },
            })}
          />
          <FieldCount value={watch("city")} max={MAX.city} />
          {errors.city && <p className="text-red-600 text-xs mt-1">{errors.city.message}</p>}
        </div>

        {/* State dropdown (50 states) */}
        <div>
          <label className="block font-medium mb-1">State</label>
          <select
            className="border rounded p-2 w-full"
            {...register("state", { required: !isExistingComputed ? "State is required" : false })}
            defaultValue=""
            disabled={isExistingComputed}
          >
            <option value="" disabled>— Select —</option>
            {US_STATES.map((s) => (
              <option key={s.abbr} value={s.abbr}>{s.name}</option>
            ))}
          </select>
          {errors.state && <p className="text-red-600 text-xs mt-1">{errors.state.message}</p>}
        </div>

        {/* Zip: exactly 5 digits */}
        <div>
          <label className="block font-medium mb-1">Zip Code</label>
          <input
            inputMode="numeric"
            className="border rounded p-2 w-full"
            placeholder="#####"
            disabled={isExistingComputed}
            {...register("zipCode", {
              required: !isExistingComputed ? "Zip code is required" : false,
              pattern: { value: /^\d{5}$/, message: "Use exactly 5 digits" },
              onChange: (e) => { e.target.value = digitsOnly(e.target.value).slice(0, 5); },
            })}
          />
          {errors.zipCode && <p className="text-red-600 text-xs mt-1">{errors.zipCode.message}</p>}
        </div>

        {/* Phones: live format (###) ###-#### */}
        <div>
          <label className="block font-medium mb-1">Home Phone</label>
          <input
            inputMode="numeric"
            className="border rounded p-2 w-full"
            placeholder="(555) 555-5555"
            disabled={isExistingComputed}
            {...register("homePhone", {
              onChange: (e) => { e.target.value = formatUSPhone(e.target.value); },
              pattern: { value: /^\(?\d{3}\)?[ ]?\d{3}-\d{4}$/, message: "Format: (555) 555-5555" },
            })}
          />
          {errors.homePhone && <p className="text-red-600 text-xs mt-1">{errors.homePhone.message}</p>}
        </div>

        <div>
          <label className="block font-medium mb-1">Cell Phone</label>
          <input
            inputMode="numeric"
            className="border rounded p-2 w-full"
            placeholder="(555) 555-5555"
            disabled={isExistingComputed}
            {...register("cellPhone", {
              onChange: (e) => { e.target.value = formatUSPhone(e.target.value); },
              pattern: { value: /^\(?\d{3}\)?[ ]?\d{3}-\d{4}$/, message: "Format: (555) 555-5555" },
            })}
          />
          {errors.cellPhone && <p className="text-red-600 text-xs mt-1">{errors.cellPhone.message}</p>}
        </div>

        <div>
          <label className="block font-medium mb-1">Work Phone</label>
          <input
            inputMode="numeric"
            className="border rounded p-2 w-full"
            placeholder="(555) 555-5555"
            disabled={isExistingComputed}
            {...register("workPhone", {
              onChange: (e) => { e.target.value = formatUSPhone(e.target.value); },
              pattern: { value: /^\(?\d{3}\)?[ ]?\d{3}-\d{4}$/, message: "Format: (555) 555-5555" },
            })}
          />
          {errors.workPhone && <p className="text-red-600 text-xs mt-1">{errors.workPhone.message}</p>}
        </div>

        <TextInput label="Email" name="email" type="email" register={register} disabled={isExistingComputed} />

        <TextInput label="Occupation" name="occupation" register={register} disabled={isExistingComputed} />

        {/* Emergency contact name + counter */}
        <div>
          <TextInput
            label="Emergency Contact Name"
            name="emergencyContactName"
            register={register}
            required={!isExistingComputed}
            maxLength={MAX.emergencyContactName}
            disabled={isExistingComputed}
            {...register("emergencyContactName", {
              required: !isExistingComputed ? "Emergency contact name is required" : false,
              maxLength: { value: MAX.emergencyContactName, message: "Too many characters" },
            })}
          />
          <FieldCount value={watch("emergencyContactName")} max={MAX.emergencyContactName} />
          {errors.emergencyContactName && (
            <p className="text-red-600 text-xs mt-1">{errors.emergencyContactName.message}</p>
          )}
        </div>

        {/* Emergency contact phone formatted */}
        <div>
          <label className="block font-medium mb-1">Emergency Contact Phone</label>
          <input
            inputMode="numeric"
            className="border rounded p-2 w-full"
            placeholder="(555) 555-5555"
            disabled={isExistingComputed}
            {...register("emergencyContactPhone", {
              required: !isExistingComputed ? "Emergency contact phone is required" : false,
              onChange: (e) => { e.target.value = formatUSPhone(e.target.value); },
              pattern: { value: /^\(?\d{3}\)?[ ]?\d{3}-\d{4}$/, message: "Format: (555) 555-5555" },
            })}
          />
          {errors.emergencyContactPhone && (
            <p className="text-red-600 text-xs mt-1">{errors.emergencyContactPhone.message}</p>
          )}
        </div>

        <TextInput label="Referred By" name="referredBy" register={register} className="md:col-span-2" disabled={isExistingComputed} />
      </div>

      {practicedBefore === "yes" && (
        <>
          <label className="block font-medium mt-4 mb-2">How often do you practice?</label>
          <select {...register("practiceFrequency")} className="border rounded p-2">
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
        </>
      )}

      {/* Yoga styles — ALWAYS visible */}
      <CheckBoxGroup
        title="Style(s) of yoga practiced most frequently: (select all that apply)"
        namePrefix="styles"
        options={yogaStyles}
        register={register}
      />

      <CheckBoxGroup
        title="Goals / Expectations"
        namePrefix="goals"
        options={[
          "Improve fitness", "Increase well​-being", "Injury rehabilitation",
          "Positive reinforcement", "Strength training", "Weight management", "Other",
        ]}
        register={register}
      />

      <CheckBoxGroup
        title="Personal Yoga Interests"
        namePrefix="interests"
        options={[
          "Asana (postures)", "Pranayama (breath work)", "Meditation",
          "Yoga Philosophy", "Eastern energy systems", "Other",
        ]}
        register={register}
      />

      {/* --- Lifestyle & Fitness --- */}
      <h3 className="text-lg font-semibold text-brandLavender">Lifestyle & Fitness</h3>
      <label className="block mb-2 font-medium">Current activity level</label>
      <select {...register("activityLevel")} className="border rounded p-2 mb-4">
        {activityLevels.map((lvl) => (
          <option key={lvl} value={lvl}>{lvl}</option>
        ))}
      </select>

      {/* Stress level dropdown 1–10 */}
      <div>
        <label className="block font-medium mb-1">Stress level (1–10)</label>
        <select
          className="border rounded p-2"
          {...register("stressLevel", {
            required: false,
            validate: (v) => (!v || (Number(v) >= 1 && Number(v) <= 10)) || "Pick 1–10",
          })}
          defaultValue=""
        >
          <option value="">— Select —</option>
          {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
            <option key={n} value={n}>{n}</option>
          ))}
        </select>
        {errors.stressLevel && <p className="text-red-600 text-xs mt-1">{errors.stressLevel.message}</p>}
      </div>

      <CheckBoxGroup title="Physical History" namePrefix="physicalHistory" options={physicalHistoryOptions}
        register={register} />
      {/* Other / Explain */}
      <div>
        <label className="block font-medium mb-1">Other / Explain</label>
        <textarea
          className="w-full border rounded p-2 mb-1"
          rows={4}
          maxLength={MAX_NOTE}                           // hard stop in the UI
          {...register("otherConditionsExplanation", {   // <-- fixed name to match payload
            maxLength: { value: MAX_NOTE, message: `Max ${MAX_NOTE} characters` },
          })}
        />
        <FieldCount value={watch("otherConditionsExplanation")} max={MAX_NOTE} />
        {errors.otherConditionsExplanation && (
          <p className="text-red-600 text-xs mt-1">
            {errors.otherConditionsExplanation.message}
          </p>
        )}
      </div>

      {/* Are you currently taking any medications? */}
      <div>
        <label className="block font-medium mb-1">
          Are you currently taking any medications?
        </label>
        <textarea
          className="w-full border rounded p-2 mb-1"
          rows={3}
          maxLength={MAX_NOTE}
          {...register("medications", {
            maxLength: { value: MAX_NOTE, message: `Max ${MAX_NOTE} characters` },
          })}
        />
        <FieldCount value={watch("medications")} max={MAX_NOTE} />
        {errors.medications && (
          <p className="text-red-600 text-xs mt-1">{errors.medications.message}</p>
        )}
      </div>

      {/* Additional details */}
      <div>
        <label className="block font-medium mb-1">
          Additional details / Anything else to share
        </label>
        <textarea
          className="w-full border rounded p-2 mb-1"
          rows={4}
          maxLength={MAX_NOTE}
          {...register("additionalDetails", {
            maxLength: { value: MAX_NOTE, message: `Max ${MAX_NOTE} characters` },
          })}
        />
        <FieldCount value={watch("additionalDetails")} max={MAX_NOTE} />
        {errors.additionalDetails && (
          <p className="text-red-600 text-xs mt-1">{errors.additionalDetails.message}</p>
        )}
      </div>

      <p className="text-sm leading-relaxed border-l-4 border-brandLavender pl-4 italic">
        We believe that yoga is more than physical exercise. It is a transformative practice…
      </p>

      <SignaturePadField
        label="Client Signature"
        onEnd={(sig) => register("signature").onChange({ target: { value: sig } })}
      />

      <div className="flex items-center gap-4">
        <button
          type="submit"
          disabled={!isValid && !selectedPatient}  // allow submit with existing client even if profile fields disabled
          className="bg-brandLavender text-white px-6 py-2 rounded-md disabled:opacity-50"
          title={!isValid && !selectedPatient ? "Fix validation errors before submitting" : ""}
        >
          Save
        </button>
        <button
          type="button"
          onClick={() => { reset(); setSelectedPatient(null); setSearch(""); }}
          className="underline text-brandLavender"
        >
          Reset
        </button>
      </div>
    </form>
  );
}
