/** Top-row summary metrics (FR8: anonymized aggregate system metrics). */
export default function StatCards({ summary, users, devices }) {
  const drivers = users.filter((u) => u.role === "Driver").length;
  const admins = users.length - drivers;
  const activeDevices = devices.filter((d) => d.status === "Active").length;
  const n = (v) => (summary ? Number(v ?? 0).toLocaleString() : "—");

  return (
    <div className="stats">
      <Card
        label="Total Alerts"
        value={n(summary?.total_events)}
        foot={summary ? `${n(summary.events_last_7d)} in the last 7 days` : "all time"}
      />
      <Card label="Combined Alerts" value={n(summary?.combined_events)} foot="highest severity" />
      <Card
        label="Registered Users"
        value={users.length}
        foot={`${drivers} driver${drivers === 1 ? "" : "s"}, ${admins} admin${admins === 1 ? "" : "s"}`}
      />
      <Card
        label="Active Devices"
        value={activeDevices}
        foot={
          summary
            ? `of ${devices.length} registered · ${n(summary.devices_reporting_24h)} reporting today`
            : `of ${devices.length} registered`
        }
      />
    </div>
  );
}

function Card({ label, value, foot }) {
  return (
    <div className="card">
      <div className="label">{label}</div>
      <div className="value">{value}</div>
      <div className="foot">{foot}</div>
    </div>
  );
}
