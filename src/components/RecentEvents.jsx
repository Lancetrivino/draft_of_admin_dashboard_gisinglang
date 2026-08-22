import { fmtDateTime, fmtNum, fmtPercent } from "../lib/format";

/** Most recent detections across all devices. */
export default function RecentEvents({ events, limit = 15 }) {
  const rows = events.slice(0, limit);

  return (
    <div className="panel">
      <h3>Recent Events</h3>
      <p className="desc">Most recent drowsiness detections across all devices.</p>

      {rows.length === 0 ? (
        <div className="empty">No events recorded yet.</div>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Time</th>
              <th>Device</th>
              <th>Level</th>
              <th>EAR</th>
              <th>PERCLOS</th>
              <th>Pitch</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((e) => (
              <tr key={e.id}>
                <td className="mono">{fmtDateTime(e.event_timestamp)}</td>
                <td>{e.device_id ?? "—"}</td>
                <td>
                  <span className={`pill ${e.alert_level}`}>{e.alert_level}</span>
                </td>
                <td className="mono">{fmtNum(e.ear_value, 3)}</td>
                <td className="mono">{fmtPercent(e.perclos_value)}</td>
                <td className="mono">{fmtNum(e.pitch, 1)}°</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
