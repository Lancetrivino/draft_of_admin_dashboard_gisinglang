import { fmtDateTime } from "../lib/format";

/**
 * System health: alert mix and SMS notification reliability, as aggregate
 * counts only (replaces the old per-event "Recent Events" table, which
 * exposed individual drivers' readings to administrators).
 */
export default function SystemHealth({ summary }) {
  if (!summary) {
    return (
      <div className="panel">
        <h3>System Health</h3>
        <div className="empty">Loading…</div>
      </div>
    );
  }

  const n = (v) => Number(v ?? 0).toLocaleString();
  const attempted = Number(summary.sms_sent ?? 0) + Number(summary.sms_failed ?? 0);
  const delivery =
    attempted > 0 ? ((100 * Number(summary.sms_sent ?? 0)) / attempted).toFixed(1) + "%" : "—";
  const latency =
    summary.sms_avg_latency_ms != null
      ? (Number(summary.sms_avg_latency_ms) / 1000).toFixed(2) + " s"
      : "—";

  return (
    <div className="panel">
      <h3>System Health</h3>
      <p className="desc">
        Aggregate figures across all devices. No individual driver data is shown.
      </p>
      <table>
        <tbody>
          <tr><td>Layer 1 alerts (eye closure)</td><td className="mono">{n(summary.layer1_events)}</td></tr>
          <tr><td>Layer 2 alerts (head pose)</td><td className="mono">{n(summary.layer2_events)}</td></tr>
          <tr><td>Combined alerts</td><td className="mono">{n(summary.combined_events)}</td></tr>
          <tr><td>Alerts in the last 24 hours</td><td className="mono">{n(summary.events_last_24h)}</td></tr>
          <tr><td>Most recent alert received</td><td className="mono">{fmtDateTime(summary.last_event_at)}</td></tr>
          <tr><td>SMS sent to emergency contacts</td><td className="mono">{n(summary.sms_sent)}</td></tr>
          <tr><td>SMS failed</td><td className="mono">{n(summary.sms_failed)}</td></tr>
          <tr><td>SMS delivery rate</td><td className="mono">{delivery}</td></tr>
          <tr><td>Average SMS send time</td><td className="mono">{latency}</td></tr>
          <tr><td>SMS skipped (cooldown, stale or no contacts)</td><td className="mono">{n(summary.sms_skipped)}</td></tr>
          <tr><td>SMS test runs (dry run, not sent)</td><td className="mono">{n(summary.sms_dry_run)}</td></tr>
        </tbody>
      </table>
    </div>
  );
}
