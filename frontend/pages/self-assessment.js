import React, {useState, useEffect, useRef} from "react";
import {useForm} from "react-hook-form";
import {TextInput} from "../components/TextInput";
import {CheckBoxGroup} from "../components/CheckBoxGroup";
import {apiFetch} from "../utils/api";
import {SearchIcon, XIcon} from "lucide-react";

const yogaStyles = [
    "Hatha", "Ashtanga", "Vinyasa/Flow", "Iyengar", "Power", "Anusara",
    "Bikram/Hot", "Forrest", "Kundalini", "Gentle", "Restorative", "Yin"
];

const activityLevels = [
    "Sedentary/Very inactive", "Somewhat inactive", "Average",
    "Somewhat active", "Extremely active"
];

const physicalHistoryConditions = [
    "Broken/Dislocated bones", "Muscle strain/sprain", "Arthritis/Bursitis",
    "Disc problems", "Scoliosis", "Back problems", "Osteoporosis",
    "Diabetes type 1 or 2", "High/Low blood pressure", "Insomnia",
    "Anxiety/Depression", "Asthma / Short breath", "Numbness / Tingling",
    "Cancer", "Seizures", "Stroke", "Heart conditions / Chest pain",
    "Pregnancy", "Auto‑immune condition", "Surgery"
];

export function SelfAssessmentPage() {
    const {register, handleSubmit, reset, setValue, formState: {errors}} = useForm();

    const [patients, setPatients] = useState([]);
    const [query, setQuery] = useState("");
    const [openDropdown, setOpenDropdown] = useState(false);
    const [highlightIdx, setHighlightIdx] = useState(0);
    const inputRef = useRef(null);
    const dropdownRef = useRef(null);
    const [selectedPatientId, setSelectedPatientId] = useState(null);

    const token = typeof window !== "undefined" ? localStorage.getItem("pies-token") : null;
    const therapistId =
        typeof window !== "undefined" ? localStorage.getItem("therapistId") || 1 : 1;

    useEffect(() => {
        if (!token) return;
        (async () => {
            try {
                const res = await fetch("http://localhost:8080/patients?page=0&size=500", {
                    headers: {Authorization: `Bearer ${token}`},
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

    const filteredPatients = patients.filter((p) =>
        p.name.toLowerCase().includes(query.toLowerCase())
    );

    const choosePatient = (p) => {
        setValue("patientId", p.id, {shouldValidate: true});
        setQuery(p.name);
        setSelectedPatientId(p.id);
        setOpenDropdown(false);
    };

    const clearPatient = () => {
        setValue("patientId", "", {shouldValidate: true});
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

    const onSubmit = (d) => {
        const assessmentPayload = {
            dateOfSession: d.dateOfSession,
            goalOfSession: d.q0 || "",
            assessment: d.q1 || "",
            patientId: selectedPatientId,
            therapistId: therapistId,
            notes: JSON.stringify(d)
        };

        apiFetch("http://localhost:8080/self-assessments", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(assessmentPayload)
        })
            .then(async (res) => {
                if (!res.ok) {
                    const errorText = await res.text();
                    console.error("Server responded with error:", res.status, errorText);
                    throw new Error(`Failed to submit assessment: ${res.status}`);
                }
                return res.json();
            })

            .then((data) => {
                alert("Assessment successfully submitted!");
                console.log("Response:", data);
                reset(); // Clear form
            })
            .catch((err) => {
                console.error(err);
                alert("There was an error submitting the assessment.");
            });
    };

    const koshas = ["Physical", "Intellectual", "Emotional", "Spiritual"];
    const asana = [
        "Sun A", "Sun B", "Seated", "Standing", "Prone", "Supine", "Balance",
        "Revolved", "Backbends", "Inversion"
    ];
    const mindfulness = [
        "Guided Visualization", "Breath‑centered", "Internal Observation",
        "External Observation", "Non‑judgement", "Other"
    ];
    const kleshas = ["Ignorance", "Egoism", "Attachment", "Aversion", "Fear of Loss"];
    const chakras = ["Root", "Sacral", "Solar Plexus", "Heart", "Throat", "Third‑Eye", "Crown"];
    const pranayama = [
        "Diaphragmatic", "Three‑Part", "Retention", "Suspension",
        "Victorious", "Alternate Nostril", "Other"
    ];

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-4xl mx-auto">
            <input type="hidden" {...register("patientId", {required: true})} />

            <div className="relative" ref={dropdownRef}>
                <label className="block font-medium mb-1">Patient</label>
                <div className="relative">
                    <input
                        ref={inputRef}
                        type="text"
                        placeholder="Search patient…"
                        className={`w-full border rounded pl-8 pr-9 py-2 ${
                            errors.patientId ? "border-red-500" : ""
                        }`}
                        value={query}
                        onChange={(e) => {
                            setQuery(e.target.value);
                            setOpenDropdown(true);
                            setHighlightIdx(0);
                            setValue("patientId", "", {shouldValidate: true});
                        }}
                        onFocus={() => setOpenDropdown(true)}
                        onKeyDown={onPatientKeyDown}
                    />
                    <SearchIcon size={18} className="absolute left-2 top-2.5 text-gray-400"/>
                    {query && (
                        <button
                            type="button"
                            className="absolute right-2 top-2.5 text-gray-400 hover:text-gray-600"
                            onClick={clearPatient}
                        >
                            <XIcon size={16}/>
                        </button>
                    )}
                </div>

                {openDropdown && filteredPatients.length > 0 && (
                    <ul className="absolute z-30 mt-1 w-full max-h-60 overflow-auto rounded-md bg-white shadow-lg border border-gray-200">
                        {filteredPatients.map((p, idx) => (
                            <li
                                key={p.id}
                                className={`px-3 py-2 cursor-pointer text-sm ${
                                    idx === highlightIdx ? "bg-brandLavender/10 text-brandLavender" : "hover:bg-gray-100"
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

            <div>
                <label className="block font-medium mb-1">Date of Session</label>
                <input type="date" {...register("dateOfSession")} required className="w-full border rounded p-2"/>
            </div>

            {[
                "How did the client(s) react to the tools presented?",
                "How did the client(s) react to you?",
                "How did you respond to the client(s)?",
                "What adaptations and/or modifications did you utilize?",
                "What are the next steps for the client(s) work with you (based on direct feedback and your observations)?",
                "What were your biggest wins of this session?",
                "What were your biggest lessons learned?",
                "What, if any, guidance do you need from your mentor?"
            ].map((q, i) => (
                <div key={i}>
                    <label className="block font-medium mb-1">{q}</label>
                    <textarea {...register(`q${i}`)} rows="3" className="w-full border rounded p-2"/>
                </div>
            ))}

            <CheckBoxGroup title="Koshas" namePrefix="koshas" options={koshas} register={register}/>
            <CheckBoxGroup title="Asana" namePrefix="asana" options={asana} register={register}/>
            <CheckBoxGroup title="Mindfulness" namePrefix="mindfulness" options={mindfulness} register={register}/>
            <CheckBoxGroup title="Kleshas" namePrefix="kleshas" options={kleshas} register={register}/>
            <CheckBoxGroup title="Chakras" namePrefix="chakras" options={chakras} register={register}/>
            <CheckBoxGroup title="Pranayama" namePrefix="pranayama" options={pranayama} register={register}/>

            <TextInput label="Other Mindfulness" name="otherMindfulness" register={register}/>
            <TextInput label="Other Pranayama" name="otherPranayama" register={register}/>

            <button type="submit" className="bg-brandLavender text-white px-6 py-2 rounded">
                Save
            </button>
        </form>
    );
}

export default SelfAssessmentPage;