// pages/soap.js
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { TextInput } from "../components/TextInput";
import { SignaturePadField } from "../components/SignaturePadField";
import { SearchIcon, XIcon } from "lucide-react";
import { API_BASE_URL } from "../utils/config";

/** Helper: live character counter */
function FieldCount({ value, max }) {
    const count = value?.length ?? 0;
    const over = max != null && count > max;
    return (
        <div className={`text-xs text-right mt-1 ${over ? "text-red-600" : "text-gray-400"}`}>
            {count}{max != null ? ` / ${max}` : ""}
        </div>
    );
}

/** DB-aligned limits */
const MAX255 = 255;   // VARCHAR(255)
const MAX100 = 100;   // VARCHAR(100) (therapist_signature) – kept visual only for now

/** Helper: format Date -> YYYY-MM-DD */
const toYmd = (d) => (d ? new Date(d).toISOString().split("T")[0] : "");

export default function SOAPFormPage() {
    const {
        register,
        handleSubmit,
        reset,
        setValue,
        watch,
        formState: { errors, isValid },
    } = useForm({ mode: "onChange" });

    const [loading, setLoading] = useState(false);

    // Patient search state
    const [patients, setPatients] = useState([]);
    const [query, setQuery] = useState("");
    const [openDropdown, setOpenDropdown] = useState(false);
    const [highlightIdx, setHighlightIdx] = useState(0);

    const inputRef = useRef(null);
    const dropdownRef = useRef(null);

    // for autofill
    const [selectedPatientId, setSelectedPatientId] = useState(null);

    const token =
        typeof window !== "undefined" ? localStorage.getItem("pies-token") : null;

    /* ──────────────── Fetch patients once ──────────────── */
    useEffect(() => {
        if (!token) return;
        (async () => {
            try {
                const res = await fetch(`${API_BASE_URL}/patients?page=0&size=500`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (!res.ok) throw new Error("Failed to load patients");
                const page = await res.json();
                setPatients(
                    page.content.map((p) => ({
                        id: p.id,
                        name: `${p.firstName} ${p.lastName}`.trim(),
                        dob: p.dateOfBirth,
                    }))
                );
            } catch (e) {
                console.error(e);
                alert(e.message);
            }
        })();
    }, [token]);

    /* ──────────────── Dropdown helpers ──────────────── */
    const filteredPatients = patients.filter((p) =>
        p.name.toLowerCase().includes(query.toLowerCase())
    );

    const choosePatient = (p) => {
        setValue("patientId", p.id, { shouldValidate: true });
        setQuery(p.name);
        setSelectedPatientId(p.id);
        setOpenDropdown(false);
    };

    const clearPatient = () => {
        setValue("patientId", "", { shouldValidate: true });
        setQuery("");
        setOpenDropdown(false);
        inputRef.current?.focus();
    };

    const onPatientKeyDown = (e) => {
        if (!openDropdown) return;
        if (e.key === "ArrowDown") {
            e.preventDefault();
            setHighlightIdx((i) => Math.min(i + 1, filteredPatients.length - 1));
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setHighlightIdx((i) => Math.max(i - 1, 0));
        } else if (e.key === "Enter") {
            e.preventDefault();
            const p = filteredPatients[highlightIdx];
            if (p) choosePatient(p);
        } else if (e.key === "Escape") {
            setOpenDropdown(false);
        }
    };

    // Click-away close
    useEffect(() => {
        const handler = (e) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(e.target) &&
                inputRef.current &&
                !inputRef.current.contains(e.target)
            ) {
                setOpenDropdown(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    /* ──────────────── Autofill from intake ──────────────── */
    useEffect(() => {
        if (!selectedPatientId || !token) return;

        (async () => {
            try {
                const res = await fetch(`${API_BASE_URL}/intakes/patient/${selectedPatientId}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });

                if (!res.ok) throw new Error("Failed to load intake data");

                const data = await res.json();

                // condition map from your intake structure
                const conditionMap = {
                    anxietyDepression: "Anxiety/Depression",
                    arthritisBursitis: "Arthritis/Bursitis",
                    asthma: "Asthma",
                    autoimmune: "Autoimmune Disorder",
                    backProblems: "Back Problems",
                    bloodPressure: "Blood Pressure Issues",
                    brokenBones: "Broken Bones",
                    cancer: "Cancer",
                    diabetes: "Diabetes",
                    discProblems: "Disc Problems",
                    heartConditions: "Heart Conditions",
                    insomnia: "Insomnia",
                    muscleStrain: "Muscle Strain",
                    numbnessTingling: "Numbness/Tingling",
                    osteoporosis: "Osteoporosis",
                    pregnancy: "Pregnancy",
                    scoliosis: "Scoliosis",
                    seizures: "Seizures",
                    stroke: "Stroke",
                    surgery: "Surgery",
                };

                const health = data.healthHistory || {};
                const conditionsList = Object.entries(conditionMap)
                    .filter(([key]) => health[key])
                    .map(([_, label]) => label);

                // Calculate age from DOB
                const dob = new Date(data.patient.dateOfBirth);
                const today = new Date();
                const age =
                    today.getFullYear() - dob.getFullYear() -
                    (today < new Date(today.getFullYear(), dob.getMonth(), dob.getDate()) ? 1 : 0);

                // Format semicolon-separated lists
                const formatList = (val) =>
                    Array.isArray(val)
                        ? val.join("; ")
                        : typeof val === "string" && val.includes(",")
                            ? val.split(",").map((v) => v.trim()).join("; ")
                            : val || "";

                // Autofill fields
                setValue("age", age);
                setValue("activityLevel", data.activityLevel || "");
                setValue("conditions", conditionsList.join("; ") || "None Reported");
                setValue("medications", formatList(data.healthHistory?.medicationsList) || "None Reported");
                setValue("goals", formatList(data.yogaGoals));
                setValue(
                    "historyOfConditions",
                    data.healthHistory?.otherConditionsExplanation?.trim() || "None Reported"
                );
            } catch (err) {
                console.error("Failed to load intake form", err);
            }
        })();
    }, [selectedPatientId, token, setValue]);

    /* ──────────────── Submit ──────────────── */
    const onSubmit = async (data) => {
        setLoading(true);
        try {
            const token = localStorage.getItem("pies-token");
            const therapistId = localStorage.getItem("therapistId") || 1;

            const payload = {
                patientId: data.patientId,
                therapistId,
                dateOfSession: data.dateOfSession,
                timeOfSession: data.timeOfSession,
                sessionLength: data.sessionLength || "",
                typeOfSession: data.typeOfSession || "", // remains optional
                activeStatus: true,

                // Meta fields from intake
                age: data.age,
                activityLevel: data.activityLevel,
                conditions: data.conditions,
                historyOfConditions: data.historyOfConditions,
                medications: data.medications,
                goals: data.goals,
                diet: data.diet,

                // SOAP blocks
                snotes: data.subjective,
                onotes: data.objective,
                anotes: data.assessment,
                pnotes: data.plan,

                // Quick notes (TEXT)
                quickNotes: data.quickNotes || "",


                signature: data.signature,
            };

            const res = await fetch(`${API_BASE_URL}/soap-notes`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(payload),
            });

            if (!res.ok) throw new Error("Failed to submit SOAP Note");
            alert("SOAP Note saved successfully!");
            reset();
        } catch (err) {
            console.error("SOAP submission failed", err);
            alert("There was an error saving the SOAP Note.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 max-w-3xl mx-auto py-10">
            <h2 className="text-2xl font-semibold text-brandLavender">SOAP Note</h2>

            {/* hidden patientId field that backend will need */}
            <input type="hidden" {...register("patientId", { required: true })} />
            <input type="hidden" {...register("signature")} />

            {/* Patient search/autocomplete */}
            <div className="relative" ref={dropdownRef}>
                <label className="block font-medium mb-1">Patient</label>
                <div className="relative">
                    <input
                        ref={inputRef}
                        type="text"
                        placeholder="Search patient…"
                        className={`w-full border rounded pl-8 pr-9 py-2 focus:outline-none focus:ring-2 focus:ring-brandLavender ${errors.patientId ? "border-red-500" : ""
                            }`}
                        value={query}
                        onChange={(e) => {
                            setQuery(e.target.value);
                            setOpenDropdown(true);
                            setHighlightIdx(0);
                            setValue("patientId", "", { shouldValidate: true });
                        }}
                        onFocus={() => setOpenDropdown(true)}
                        onKeyDown={onPatientKeyDown}
                    />
                    <SearchIcon size={18} className="absolute left-2 top-2.5 text-gray-400 pointer-events-none" />
                    {query && (
                        <button
                            type="button"
                            className="absolute right-2 top-2.5 text-gray-400 hover:text-gray-600"
                            onClick={clearPatient}
                        >
                            <XIcon size={16} />
                        </button>
                    )}
                </div>

                {openDropdown && filteredPatients.length > 0 && (
                    <ul className="absolute z-30 mt-1 w-full max-h-60 overflow-auto rounded-md bg-white shadow-lg border border-gray-200">
                        {filteredPatients.map((p, idx) => (
                            <li
                                key={p.id}
                                className={`px-3 py-2 cursor-pointer text-sm ${idx === highlightIdx ? "bg-brandLavender/10 text-brandLavender" : "hover:bg-gray-100"
                                    }`}
                                onMouseDown={(e) => {
                                    e.preventDefault();
                                    choosePatient(p);
                                }}
                                onMouseEnter={() => setHighlightIdx(idx)}
                            >
                                <span className="font-medium">{p.name}</span>
                                {p.dob && <span className="ml-2 text-gray-500 text-xs">({p.dob})</span>}
                            </li>
                        ))}
                    </ul>
                )}
                {errors.patientId && (
                    <p className="text-red-500 text-xs mt-1">Please pick a patient from the list.</p>
                )}
            </div>

            {/* Basic meta fields */}
            <div className="grid sm:grid-cols-2 gap-4">
                <TextInput
                    label="Date of Session"
                    name="dateOfSession"
                    type="date"
                    register={register}
                    required
                    {...register("dateOfSession", { required: "Date is required" })}
                />

                <TextInput
                    label="Time of Session"
                    name="timeOfSession"
                    type="time"
                    register={register}
                    required
                    {...register("timeOfSession", { required: "Time is required" })}
                />

                {/* session_length is VARCHAR(255) */}
                <div className="sm:col-span-2">
                    <label className="block font-medium mb-1">Session Length</label>
                    <input
                        className="w-full border rounded p-2"
                        placeholder="e.g. 60 min"
                        maxLength={MAX255}
                        {...register("sessionLength", {
                            maxLength: { value: MAX255, message: `Max ${MAX255} characters` },
                        })}
                    />
                    <FieldCount value={watch("sessionLength")} max={MAX255} />
                    {errors.sessionLength && (
                        <p className="text-red-600 text-xs mt-1">{errors.sessionLength.message}</p>
                    )}
                </div>

                <TextInput label="Age" name="age" type="number" register={register} min={0}
                    {...register("age", {
                        min: { value: 0, message: "Age cannot be negative" },
                        max: { value: 120, message: "Please enter a realistic age" },
                        valueAsNumber: true,
                    })}
                />

                {/* Activity Level (VARCHAR(255)) */}
                <div className="sm:col-span-1">
                    <label className="block font-medium mb-1">Activity Level</label>
                    <select
                        className="w-full border rounded p-2"
                        {...register("activityLevel", {
                            maxLength: { value: MAX255, message: `Max ${MAX255} characters` },
                        })}
                    >
                        <option value="">— Select —</option>
                        <option value="Sedentary/Very inactive">Sedentary/Very inactive</option>
                        <option value="Somewhat inactive">Somewhat inactive</option>
                        <option value="Average">Average</option>
                        <option value="Somewhat active">Somewhat active</option>
                        <option value="Extremely active">Extremely active</option>
                    </select>
                </div>
            </div>

            {/* VARCHAR(255) textareas with counters */}
            <div>
                <label className="block font-medium mb-1">Conditions</label>
                <textarea
                    className="w-full border rounded p-3"
                    rows={5}
                    placeholder="Describe current conditions, complaints, etc."
                    maxLength={MAX255}
                    {...register("conditions", {
                        maxLength: { value: MAX255, message: `Max ${MAX255} characters` },
                    })}
                />
                <FieldCount value={watch("conditions")} max={MAX255} />
                {errors.conditions && <p className="text-red-600 text-xs mt-1">{errors.conditions.message}</p>}
            </div>

            <div>
                <label className="block font-medium mb-1">History of Condition(s)</label>
                <textarea
                    className="w-full border rounded p-3"
                    rows={4}
                    placeholder="Past injuries, surgeries, relevant medical history…"
                    maxLength={MAX255}
                    {...register("historyOfConditions", {
                        maxLength: { value: MAX255, message: `Max ${MAX255} characters` },
                    })}
                />
                <FieldCount value={watch("historyOfConditions")} max={MAX255} />
                {errors.historyOfConditions && (
                    <p className="text-red-600 text-xs mt-1">{errors.historyOfConditions.message}</p>
                )}
            </div>

            <div>
                <label className="block font-medium mb-1">Medications</label>
                <textarea
                    className="w-full border rounded p-3"
                    rows={4}
                    placeholder="List medications (one per line or separated by commas)"
                    maxLength={MAX255}
                    {...register("medications", {
                        maxLength: { value: MAX255, message: `Max ${MAX255} characters` },
                    })}
                />
                <FieldCount value={watch("medications")} max={MAX255} />
                {errors.medications && <p className="text-red-600 text-xs mt-1">{errors.medications.message}</p>}
            </div>

            <div>
                <label className="block font-medium mb-1">Goals</label>
                <textarea
                    className="w-full border rounded p-3"
                    rows={4}
                    placeholder="Short and long term goals..."
                    maxLength={MAX255}
                    {...register("goals", {
                        maxLength: { value: MAX255, message: `Max ${MAX255} characters` },
                    })}
                />
                <FieldCount value={watch("goals")} max={MAX255} />
                {errors.goals && <p className="text-red-600 text-xs mt-1">{errors.goals.message}</p>}
            </div>

            <div>
                <label className="block font-medium mb-1">Diet</label>
                <textarea
                    className="w-full border rounded p-3"
                    rows={4}
                    placeholder="Dietary considerations, restrictions, preferences..."
                    maxLength={MAX255}
                    {...register("diet", {
                        maxLength: { value: MAX255, message: `Max ${MAX255} characters` },
                    })}
                />
                <FieldCount value={watch("diet")} max={MAX255} />
                {errors.diet && <p className="text-red-600 text-xs mt-1">{errors.diet.message}</p>}
            </div>

            {/* SOAP sections (all VARCHAR(255)) */}
            {[
                { label: "Subjective (S)", name: "subjective" },
                { label: "Objective (O)", name: "objective" },
                { label: "Assessment (A)", name: "assessment" },
                { label: "Plan (P)", name: "plan" },
            ].map((sec) => (
                <div key={sec.name}>
                    <label className="block font-medium mb-1">{sec.label}</label>
                    <textarea
                        rows={5}
                        className="w-full border rounded p-3"
                        maxLength={MAX255}
                        {...register(sec.name, {
                            maxLength: { value: MAX255, message: `Max ${MAX255} characters` },
                        })}
                    />
                    <FieldCount value={watch(sec.name)} max={MAX255} />
                    {errors[sec.name] && <p className="text-red-600 text-xs mt-1">{errors[sec.name].message}</p>}
                </div>
            ))}

            {/* Quick Notes (TEXT) – no DB limit */}
            <div>
                <label className="block font-medium mb-1">Quick Notes</label>
                <textarea
                    className="w-full border rounded p-3"
                    rows={4}
                    placeholder="Any brief notes, comments, reminders..."
                    {...register("quickNotes")}
                />
                <FieldCount value={watch("quickNotes")} />
            </div>

            {/* Signature block (DB column is VARCHAR(100); current pad is visual-only) */}
            <div>
                <SignaturePadField
                    label="Therapist Signature"
                    onEnd={(sig) => setValue("signature", sig, { shouldValidate: true })}
                />
                {/* If you switch to storing a typed signature, cap it at MAX100 and send to backend. */}
            </div>

            <div className="flex gap-3 pt-4">
                <button
                    type="submit"
                    disabled={loading || !isValid}
                    className="bg-brandLavender text-white px-6 py-2 rounded disabled:opacity-50"
                    title={!isValid ? "Fix validation errors before submitting" : ""}
                >
                    {loading ? "Saving…" : "Save"}
                </button>
                <button
                    type="button"
                    onClick={() => reset()}
                    className="underline text-brandLavender"
                >
                    Reset
                </button>
            </div>
        </form>
    );
}
