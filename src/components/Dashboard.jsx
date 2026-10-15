import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import StatCards from "./StatCards";
import EventsChart from "./EventsChart";
import DevicesPanel from "./DevicesPanel";
import UsersPanel from "./UsersPanel";
import SystemHealth from "./SystemHealth";

// Admins never read individual drowsiness events, sensor values, contacts or
// SMS log rows (Data Privacy Act, R.A. 10173). They only receive aggregate
// counts from two database functions that check the Administrator role
// server-side: admin_system_summary() and admin_daily_alert_counts().
const REFRESH_MS = 30_000;
const CHART_DAYS = 90;

export default function Dashboard({ user, onSignOut }) {
  const [summary, setSummary] = useState(null);
  const [daily, setDaily] = useState([]);
  const [devices, setDevices] = useState([]);
  const [users, setUsers] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [updatedAt, setUpdatedAt] = useState(null);

  const loadStats = useCallback(async () => {
    const [s, d] = await Promise.all([
      supabase.rpc("admin_system_summary"),
      supabase.rpc("admin_daily_alert_counts", { days: CHART_DAYS }),
    ]);
    if (s.error) throw new Error("summary: " + s.error.message);
    if (d.error) throw new Error("daily counts: " + d.error.message);
    setSummary(s.data ?? null);
    setDaily(d.data ?? []);
    setUpdatedAt(new Date());
  }, []);

  const loadDevices = useCallback(async () => {
    const { data, error } = await supabase
      .from("devices")
      .select("device_id, unit_label, status, firmware_version, last_seen_at, registered_at, user_id")
      .order("registered_at", { ascending: false });
    if (error) throw new Error("devices: " + error.message);
    setDevices(data ?? []);
  }, []);

  const loadUsers = useCallback(async () => {
    const { data, error } = await supabase
      .from("users")
      .select("user_id, email, role, created_at")
      .order("created_at", { ascending: false });
    if (error) throw new Error("users: " + error.message);
    setUsers(data ?? []);
  }, []);

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError("");
    // Load in parallel but report every failure, rather than letting the
    // first rejection hide the others.
    const results = await Promise.allSettled([loadStats(), loadDevices(), loadUsers()]);
    const failures = results.filter((r) => r.status === "rejected");
    if (failures.length) {
      setError("Some data could not be loaded — " + failures.map((f) => String(f.reason)).join("; "));
    }
    setLoading(false);
  }, [loadStats, loadDevices, loadUsers]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  // Admins cannot subscribe to individual event rows any more, so the
  // aggregate figures are refreshed on a timer instead.
  useEffect(() => {
    const id = setInterval(() => {
      loadStats().catch(() => {});
    }, REFRESH_MS);
    return () => clearInterval(id);
  }, [loadStats]);

  async function handleSignOut() {
    await supabase.auth.signOut();
    onSignOut();
  }

  return (
    <>
      <header>
        <div className="brand">
          <img src="/logo.png" alt="GisingLang logo" width={36} height={36} />
          <div>
          <h1>GisingLang — System Administrator Dashboard</h1>
          <div className="sub">
            <span className={`live-dot ${updatedAt ? "" : "off"}`} />
            {updatedAt
              ? `Auto-refresh every 30 s · updated ${updatedAt.toLocaleTimeString()}`
              : "Not loaded"}{" "}
            · {user.email}
          </div>
          </div>
        </div>
        <div className="row-actions">
          <button onClick={loadAll} disabled={loading}>
            {loading ? "Loading…" : "Refresh"}
          </button>
          <button onClick={handleSignOut}>Sign out</button>
        </div>
      </header>

      <main>
        {error && <div className="msg error">{error}</div>}

        <StatCards summary={summary} users={users} devices={devices} />
        <EventsChart daily={daily} days={CHART_DAYS} />
        <SystemHealth summary={summary} />
        <DevicesPanel devices={devices} users={users} onChanged={loadDevices} onError={setError} />
        <UsersPanel users={users} />
      </main>
    </>
  );
}
