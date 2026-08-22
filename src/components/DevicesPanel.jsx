import { useState } from "react";
import { supabase } from "../lib/supabase";
import { fmtDate, fmtDateTime } from "../lib/format";

/** Device registration, status control, and firmware tracking (FR8). */
export default function DevicesPanel({ devices, onChanged, onError }) {
  const [unitLabel, setUnitLabel] = useState("");
  const [firmware, setFirmware] = useState("");
  const [busy, setBusy] = useState(false);

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
