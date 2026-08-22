/** Top-row summary metrics (FR8: aggregate system metrics). */
export default function StatCards({ events, users, devices }) {
  const combined = events.filter((e) => e.alert_level === "COMBINED").length;
  const drivers = users.filter((u) => u.role === "Driver").length;
  const admins = users.length - drivers;
  const activeDevices = devices.filter((d) => d.status === "Active").length;

  return (
    <div className="stats">
      <Card
        label="Total Events"
        value={events.length >= 1000 ? "1000+" : events.length}
        foot="all time"
      />
      <Card label="Combined Alerts" value={combined} foot="highest severity" />
      <Card
        label="Registered Users"
        value={users.length}
        foot={`${drivers} driver${drivers === 1 ? "" : "s"}, ${admins} admin${admins === 1 ? "" : "s"}`}
      />
      <Card
        label="Active Devices"
        value={activeDevices}
        foot={`of ${devices.length} registered`}
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
