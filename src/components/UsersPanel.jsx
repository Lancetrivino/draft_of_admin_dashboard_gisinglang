import { fmtDate } from "../lib/format";

/** Registered accounts and their assigned roles (FR8). */
export default function UsersPanel({ users }) {
  return (
    <div className="panel">
      <h3>User Accounts</h3>
      <p className="desc">Registered accounts and their assigned roles.</p>

      {users.length === 0 ? (
        <div className="empty">No user accounts found.</div>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Email</th>
              <th>Role</th>
              <th>User ID</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.user_id}>
                <td>{u.email ?? "—"}</td>
                <td>{u.role}</td>
                <td className="mono">{String(u.user_id).slice(0, 8)}…</td>
                <td className="mono">{fmtDate(u.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
