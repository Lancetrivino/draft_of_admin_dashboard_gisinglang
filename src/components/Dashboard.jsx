import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import StatCards from "./StatCards";
import EventsChart from "./EventsChart";
import DevicesPanel from "./DevicesPanel";
import UsersPanel from "./UsersPanel";
import RecentEvents from "./RecentEvents";

export default function Dashboard({ user, onSignOut }) {
  const [events, setEvents] = useState([]);
  const [devices, setDevices] = useState([]);
  const [users, setUsers] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [live, setLive] = useState(false);

  const loadEvents = useCallback(async () => {
    const { data, error } = await supabase
      .from("drowsiness_events")
      .select("id, device_id, event_timestamp, alert_level, ear_value, perclos_value, pitch")
      .order("event_timestamp", { ascending: false })
      .limit(1000);
    if (error) throw new Error("events: " + error.message);
    setEvents(data ?? []);
  }, []);

  const loadDevices = useCallback(async () => {
    const { data, error } = await supabase
      .from("devices")
      .select("device_id, unit_label, status, firmware_version, last_seen_at, registered_at")
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
    const results = await Promise.allSettled([loadEvents(), loadDevices(), loadUsers()]);
    const failures = results.filter((r) => r.status === "rejected");
    if (failures.length) {
      setError("Some data could not be loaded — " + failures.map((f) => String(f.reason)).join("; "));
    }
    setLoading(false);
  }, [loadEvents, loadDevices, loadUsers]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  // Live updates: refresh the events list whenever the Pi inserts a new row.
  // RLS applies to realtime too, so this only ever delivers rows this account
  // is allowed to see.
  useEffect(() => {
    const channel = supabase
      .channel("admin-events")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "drowsiness_events" },
        () => {
          loadEvents().catch(() => {});
        }
      )
      .subscribe((status) => setLive(status === "SUBSCRIBED"));

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadEvents]);

  async function handleSignOut() {
    await supabase.auth.signOut();
    onSignOut();
  }

  return (
    <>
      <header>
        <div>
          <h1>GisingLang — System Administrator Dashboard</h1>
          <div className="sub">
            <span className={`live-dot ${live ? "" : "off"}`} />
            {live ? "Live" : "Offline"} · {user.email}
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

        <StatCards events={events} users={users} devices={devices} />
        <EventsChart events={events} />
        <DevicesPanel devices={devices} onChanged={loadDevices} onError={setError} />
        <UsersPanel users={users} />
        <RecentEvents events={events} />
      </main>
    </>
  );
}
