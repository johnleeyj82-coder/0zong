"use client";
import Dashboard from "../components/Dashboard";

/** Direct link for the owner: /admin. Visitors without the owner cookie see "방 주인만 볼 수 있어요". */
export default function AdminPage() {
  return (
    <main className="admin-page">
      <Dashboard onLogout={() => { window.location.href = "/"; }} />
      <p style={{ marginTop: "2rem" }}><a href="/" className="btn-ghost">방으로 돌아가기</a></p>
    </main>
  );
}
