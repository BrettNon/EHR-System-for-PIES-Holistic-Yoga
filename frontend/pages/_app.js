import "../styles/globals.css";

import Layout from "../components/Layout";

export default function MyApp({ Component, pageProps, router }) {
  // derive simple title from route path
  const routeToTitle = {
    "/login": "Login",
    "/intake": "Intake Form",
    "/soap": "SOAP Notes",
    "/self-assessment": "Self Assessment",
    "/clients/assigned": "Assigned Clients",
    "/clients/search": "Search Client Records",
    "/clients/history": "Session History",
    "/clients/all": "All Clients",
    "/notes": "Therapist Notes",
    "/therapists/manage": "Manage Junior Therapists",
    "/therapists/edit": "Edit Therapist",
  };

  return (
    <Layout title={routeToTitle[router.pathname] || "PIES App"}>
      <Component {...pageProps} />
    </Layout>
  );
}