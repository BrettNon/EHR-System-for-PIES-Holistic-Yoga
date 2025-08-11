import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/router";
import { useState, useEffect } from "react";
import { Menu } from "@headlessui/react";
import { ChevronDownIcon, HomeIcon, LogOutIcon } from "lucide-react";

/* ——— small helper to read username from JWT ——— */
function getUsernameFromJwt(token) {
  if (!token) return "";
  try {
    const base64Url = token.split(".")[1];
    const json = atob(base64Url);
    const { sub } = JSON.parse(json);
    return sub || "";
  } catch {
    return "";
  }
}

export default function Layout({ title, children }) {
  const router = useRouter();

  const [showSidebars] = useState(!router.pathname.startsWith("/login"));
  const [username, setUsername] = useState("");
  const [role, setRole] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("pies-token");
    setUsername(getUsernameFromJwt(token));
    setRole(localStorage.getItem("pies-role") || "");
  }, [router.asPath]);

  const logout = () => {
    localStorage.removeItem("pies-token");
    localStorage.removeItem("pies-role");
    router.push("/login");
  };

  return (
    <div className="min-h-screen flex flex-col bg-white text-gray-800">
      {/* ——— top bar ——— */}
      <header className="bg-brandLavender shadow-md h-16 flex items-center px-4 fixed inset-x-0 top-0 z-50">
        {/* logo (bigger) */}
        <Link href="/dashboard" className="flex items-center" aria-label="Go to dashboard">
          <Image
            src="/new-logo1-png.webp"
            alt="PIES Logo"
            width={48}
            height={48}
            priority
            className="object-contain"
          />
        </Link>

        {/* page title only */}
        <h1 className="ml-4 text-white font-semibold">
          {title}
        </h1>

        {/* dev badge (only in non-prod builds) */}
        {process.env.NODE_ENV !== "production" && (
          <span className="ml-4 px-2 py-0.5 rounded bg-yellow-300 text-xs font-semibold text-gray-900">
            DEV
          </span>
        )}

        {/* nav items */}
        <nav className="ml-10 flex items-center space-x-3 text-white">
          <Link href="/dashboard" className="hover:opacity-80">
            <HomeIcon size={20} strokeWidth={2.2} />
          </Link>

          {/* dropdown */}
          <Menu as="div" className="relative">
            <Menu.Button className="flex items-center space-x-1 hover:opacity-80">
              <span>Navigate</span>
              <ChevronDownIcon size={16} />
            </Menu.Button>
            <Menu.Items className="absolute mt-1 w-48 right-0 bg-white text-gray-700 rounded shadow-lg ring-1 ring-black/5 focus:outline-none z-50">
              {[
                { label: "Intake Form", href: "/intake" },
                { label: "SOAP Form", href: "/soap" },
                { label: "Self Assessment", href: "/self-assessment" },
                { label: "Session History", href: "/clients/history" },
                { label: "Assigned Clients", href: "/clients/assigned" },
                { label: "Dashboard", href: "/dashboard" },
              ].map(({ href, label }) => (
                <Menu.Item key={href}>
                  {({ active }) => (
                    <Link
                      href={href}
                      className={`block px-4 py-2 text-sm ${active ? "bg-gray-100" : ""}`}
                    >
                      {label}
                    </Link>
                  )}
                </Menu.Item>
              ))}
            </Menu.Items>
          </Menu>
        </nav>

        {/* spacer */}
        <div className="flex-1" />

        {/* username | role | logout */}
        {username && (
          <div className="hidden sm:flex items-center space-x-3 text-white mr-4">
            <span className="truncate max-w-[10rem]">{username}</span>
            <span>|</span>
            <span className="truncate max-w-[10rem]">{role}</span>
            <button onClick={logout} title="Logout" className="hover:opacity-80 p-1">
              <LogOutIcon size={18} />
            </button>
          </div>
        )}
      </header>

      {/* ——— gradient side-bars + main ——— */}
      <div className="flex pt-16 min-h-[calc(100vh-4rem)]">
        {showSidebars && (
          <>
            <div className="fixed top-16 left-0 w-48 h-[calc(100vh-4rem)] bg-gradient-to-b from-brandLavender to-brandLavender/10" />
            <div className="fixed top-16 right-0 w-48 h-[calc(100vh-4rem)] bg-gradient-to-b from-brandLavender to-brandLavender/10" />
          </>
        )}

        <main className="flex-1 px-4 lg:px-8 py-8 lg:pl-56 lg:pr-56">
          {children}
        </main>
      </div>
    </div>
  );
}
