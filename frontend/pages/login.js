import { useRouter } from "next/router";
import { useState } from "react";
import { ChevronDownIcon, ChevronUpIcon } from "lucide-react";
import { API_BASE_URL } from "../utils/config";

const ROLE_LABELS = {
  ADMIN: "Admin",
  SENIOR: "Senior Therapist",
  JUNIOR: "Therapist",
};

/* ————————————————— API helpers ————————————————— */

async function loginRequest(username, password) {
  const res = await fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  if (!res.ok) throw new Error("Login failed");
  return await res.json(); // { token, role }
}

async function registerRequest(payload) {
  const token = localStorage.getItem("pies-token");
  if (!token)
    throw new Error("Must be logged in as ADMIN to create accounts");

  const res = await fetch(`${API_BASE_URL}/auth/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const { message } = await res.json();
    throw new Error(message || "Registration failed");
  }
  return await res.json(); // saved Therapist entity
}

/* ————————————————— Component ————————————————— */

export default function Login() {
  const router = useRouter();

  /* login state */
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  /* create‑account state */
  const [createOpen, setCreateOpen] = useState(false);
  const [newUser, setNewUser] = useState({
    username: "",
    password: "",
    firstName: "",
    lastName: "",
    email: "",
    role: "JUNIOR",
  });

  /* helpers */
  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const { token, role } = await loginRequest(username, password);
      localStorage.setItem("pies-token", token);
      localStorage.setItem("pies-role", ROLE_LABELS[role]);
      router.push("/dashboard");
    } catch (err) {
      alert(err.message);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      await registerRequest(newUser);
      alert("Account created! New user can now log in.");
      setCreateOpen(false);
      setNewUser({
        username: "",
        password: "",
        firstName: "",
        lastName: "",
        email: "",
        role: "JUNIOR",
      });
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-gray-50 p-6 rounded-lg shadow space-y-8">
      {/* ——————— LOGIN ——————— */}
      <div>
        <h2 className="text-2xl font-semibold mb-4 text-center">Login</h2>
        <form onSubmit={handleLogin} className="space-y-4">
          <input
            type="text"
            placeholder="Username"
            className="w-full border p-2 rounded"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            className="w-full border p-2 rounded"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button
            type="submit"
            className="w-full bg-brandLavender text-white py-2 rounded hover:opacity-90"
          >
            Enter
          </button>
        </form>
      </div>

      {/* ——————— CREATE ACCOUNT ——————— */}
      <div className="border-t pt-4">
        <button
          onClick={() => setCreateOpen((o) => !o)}
          className="flex items-center space-x-1 text-brandLavender hover:underline"
        >
          <span>{createOpen ? "Hide" : "Create new account"}</span>
          {createOpen ? (
            <ChevronUpIcon size={16} />
          ) : (
            <ChevronDownIcon size={16} />
          )}
        </button>

        {createOpen && (
          <form onSubmit={handleRegister} className="mt-4 space-y-3">
            <input
              type="text"
              placeholder="Username*"
              className="w-full border p-2 rounded"
              value={newUser.username}
              onChange={(e) =>
                setNewUser({ ...newUser, username: e.target.value })
              }
              required
            />
            <input
              type="password"
              placeholder="Password*"
              className="w-full border p-2 rounded"
              value={newUser.password}
              onChange={(e) =>
                setNewUser({ ...newUser, password: e.target.value })
              }
              required
            />
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="First name"
                className="w-1/2 border p-2 rounded"
                value={newUser.firstName}
                onChange={(e) =>
                  setNewUser({ ...newUser, firstName: e.target.value })
                }
              />
              <input
                type="text"
                placeholder="Last name"
                className="w-1/2 border p-2 rounded"
                value={newUser.lastName}
                onChange={(e) =>
                  setNewUser({ ...newUser, lastName: e.target.value })
                }
              />
            </div>
            <input
              type="email"
              placeholder="Email"
              className="w-full border p-2 rounded"
              value={newUser.email}
              onChange={(e) =>
                setNewUser({ ...newUser, email: e.target.value })
              }
            />

            {/* role selector visible only if current token says ADMIN */}
            {localStorage.getItem("pies-role") === "Admin" && (
              <select
                className="w-full border p-2 rounded bg-white"
                value={newUser.role}
                onChange={(e) =>
                  setNewUser({ ...newUser, role: e.target.value })
                }
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
              Create account
            </button>

            <p className="text-xs text-gray-500">
              *Only administrators can create new accounts. Log in as an admin
              first, then fill out this form.
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
