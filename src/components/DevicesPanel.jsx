import { useState } from "react";
import { supabase } from "../lib/supabase";
import { fmtDate, fmtDateTime } from "../lib/format";

/** Device registration, status control, and firmware tracking (FR8). */
export default function DevicesPanel({ devices, users, onChanged, onError }) {
  const [unitLabel, setUnitLabel] = useState("");
  const [firmware, setFirmware] = useState("");
  const [busy, setBusy] = useState(false);

  const drivers = (users ?? []).filter((u) => u.role === "Driver");

  function driverLabel(userId) {
    if (!userId) return null;
    const match = (users ?? []).find((u) => u.user_id === userId);
    return match ? match.email : "(unknown driver)";
  }

  // Every event a device logs is attributed to whoever owns it at insert
  // time (see the attach_event_owner trigger), so reassigning here changes
  // where *future* events land — it does not move history that's already
  // been written under the previous owner.
  async function assignOwner(device, userId) {
    const { error } = await supabase
      .from("devices")
      .update({ user_id: userId || null })
      .eq("device_id", device.device_id);
    if (error) {
      onError("Could not reassign device: " + error.message);
      return;
    }
    onError("");
    onChanged();
  }

  async function registerDevice() {
    const label = unitLabel.trim();
    if (!label) {
      onError("Enter a unit label (e.g. PI-002).");
      return;
    }

    setBusy(true);
    try {
      const { error } = await supabase.from("devices").insert({
        unit_label: label,
        firmware_version: firmware.trim() || "v1.0.0",
      });
      if (error) {
        const duplicate = /duplicate|unique/i.test(error.message);
        onError(
          duplicate
            ? `A device with unit label "${label}" already exists.`
            : "Could not register device: " + error.message
        );
        return;
      }
      setUnitLabel("");
      setFirmware("");
      onError("");
      onChanged();
    } finally {
      setBusy(false);
    }
  }

  async function toggleStatus(device) {
    const next = device.status === "Active" ? "Inactive" : "Active";
    const { error } = await supabase
      .from("devices")
      .update({ status: next })
      .eq("device_id", device.device_id);
    if (error) {
      onError("Could not update device: " + error.message);
      return;
    }
    onChanged();
  }

  return (
    <div className="panel">
      <h3>Registered Devices</h3>
      <p className="desc">Device registration, status, and firmware version tracking.</p>

      <div className="toolbar">
        <div>
          <label htmlFor="new-unit">Unit label</label>
          <input
            id="new-unit"
            placeholder="PI-002"
            value={unitLabel}
            onChange={(e) => setUnitLabel(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="new-fw">Firmware</label>
          <input
            id="new-fw"
            placeholder="v1.0.0"
            value={firmware}
            onChange={(e) => setFirmware(e.target.value)}
          />
        </div>
        <button className="primary" onClick={registerDevice} disabled={busy}>
          {busy ? "Registering…" : "Register device"}
        </button>
      </div>

      {devices.length === 0 ? (
        <div className="empty">No devices registered yet.</div>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Unit</th>
              <th>Status</th>
              <th>Firmware</th>
              <th>Driver</th>
              <th>Last seen</th>
              <th>Registered</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {devices.map((d) => (
              <tr key={d.device_id}>
                <td>
                  <strong>{d.unit_label}</strong>
                </td>
                <td>
                  <span className={`pill ${d.status}`}>{d.status}</span>
                </td>
                <td className="mono">{d.firmware_version ?? "—"}</td>
                <td>
                  <select
                    value={d.user_id ?? ""}
                    onChange={(e) => assignOwner(d, e.target.value)}
                    title={driverLabel(d.user_id) ?? "Unassigned — new events won't be attributed to anyone"}
                  >
                    <option value="">— Unassigned —</option>
                    {drivers.map((u) => (
                      <option key={u.user_id} value={u.user_id}>
                        {u.email}
                      </option>
                    ))}
                    {/* Keeps the current owner selectable even if their role
                        changed or they're somehow not in the Driver list. */}
                    {d.user_id && !drivers.some((u) => u.user_id === d.user_id) && (
                      <option value={d.user_id}>{driverLabel(d.user_id)}</option>
                    )}
                  </select>
                </td>
                <td className="mono">
                  {d.last_seen_at ? fmtDateTime(d.last_seen_at) : "never"}
                </td>
                <td className="mono">{fmtDate(d.registered_at)}</td>
                <td>
                  <div className="row-actions">
                    <button onClick={() => toggleStatus(d)}>
                      {d.status === "Active" ? "Deactivate" : "Activate"}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
