import { useState } from "react";
import { Outlet, ScrollRestoration } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";
import NoticeTicker from "./NoticeTicker";
import ClientWelcomeModal from "../client/ClientWelcomeModal";

export default function Layout() {
  // Welcome popup on the public site — shows once each time the site is opened
  // (Layout mounts once per full page load), with the same welcome message +
  // admin-editable announcement used in the client workspace.
  const [showWelcome, setShowWelcome] = useState(true);

  return (
    <div className="flex min-h-screen flex-col">
      {showWelcome && <ClientWelcomeModal onClose={() => setShowWelcome(false)} />}
      <NoticeTicker />
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <ScrollRestoration />
    </div>
  );
}
