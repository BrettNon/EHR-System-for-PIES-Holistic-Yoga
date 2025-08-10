import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { apiFetch } from "../../utils/api";

const ROLE_LABELS = {
    ADMIN: "Admin",
    SENIOR: "Senior Therapist",
    JUNIOR: "Therapist",
};

export default function EditTherapistPage() {
    const router = useRouter();
    const { id } = router.query;
    const [loading, setLoading] = useState(true);
    const [form, setForm] = useState({
        firstName: "",
        lastName: "",
        email: "",
        phoneNumber: "",
        password: "",
        role: "JUNIOR",
    });

    const token =
        typeof window !== "undefined" ? localStorage.getItem("pies-token") : null;
    const userRole =
        typeof window !== "undefined" ? localStorage.getItem("pies-role") : "";

    useEffect(() => {
        if (!id || !token) return;
        (async () => {
            try {
                const res = await apiFetch(`http://localhost:8080/therapists/${id}`);
                if (!res.ok) throw new Error("Failed to load therapist");
                const data = await res.json();
                setForm({
                    firstName: data.firstName || "",
                    lastName: data.lastName || "",
                    email: data.email || "",
                    phoneNumber: data.phoneNumber || "",
                    password: "",
                    role: data.role,
                });
            } catch (e) {
                alert(e.message);
            } finally {
                setLoading(false);
            }
        })();
    }, [id, token]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = { ...form };
            if (!payload.password) delete payload.password;
            if (userRole !== "Admin") delete payload.role;
            const res = await apiFetch(`http://localhost:8080/therapists/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            const resp = await res.text();
            if (!res.ok) {
                let msg = "Update failed";
                try {
                    msg = JSON.parse(resp).message || msg;
                } catch (_) {}
                throw new Error(msg);
            }
            try {
                const meRes = await apiFetch("http://localhost:8080/auth/me");
                if (meRes.ok) {
                    const me = await meRes.json();
                    localStorage.setItem(
                        "pies-role",
                        ROLE_LABELS[me.role] ?? me.role
                    );
                }
            } catch (_) {}
            alert("Therapist updated");
            router.push("/therapists/manage");
        } catch (err) {
            alert(err.message);
        }
    };

    if (loading) return <p className="text-center">Loading…</p>;

    return (
        <div className="max-w-md mx-auto bg-gray-50 p-6 rounded-lg shadow space-y-4">
            <h2 className="text-2xl font-semibold text-brandLavender">Edit Therapist</h2>
            <form onSubmit={handleSubmit} className="space-y-3">
                <input
                    type="text"
                    placeholder="First name"
                    className="w-full border p-2 rounded"
                    value={form.firstName}
                    onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                />
                <input
                    type="text"
                    placeholder="Last name"
                    className="w-full border p-2 rounded"
                    value={form.lastName}
                    onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                />
                <input
                    type="email"
                    placeholder="Email"
                    className="w-full border p-2 rounded"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
                <input
                    type="text"
                    placeholder="Phone"
                    className="w-full border p-2 rounded"
                    value={form.phoneNumber}
                    onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })}
                />
                <input
                    type="password"
                    placeholder="New password"
                    className="w-full border p-2 rounded"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                />
                {userRole === "Admin" && (
                    <select
                        className="w-full border p-2 rounded bg-white"
                        value={form.role}
                        onChange={(e) => setForm({ ...form, role: e.target.value })}
                    >
                        <option value="JUNIOR">Therapist</option>
                        <option value="SENIOR">Senior Therapist</option>
                        <option value="ADMIN">Admin</option>
                    </select>
                )}
                <button
                    type="submit"
                    className="w-full bg-brandLavender text-white py-2 rounded hover:opacity-90"
                >
                    Save Changes
                </button>
            </form>
        </div>
    );
}