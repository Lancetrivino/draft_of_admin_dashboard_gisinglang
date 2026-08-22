import { useState } from "react";
import { supabase } from "../lib/supabase";

/**
 * Sign-in screen for the System Administrator dashboard.
 *
 * After authenticating we also verify the account's role is 'Administrator'.
 * Row Level Security already prevents a Driver from reading other people's
 * data, but without this check a Driver who signed in here would just see a
 * dashboard full of zeroes with no explanation - so we fail loudly instead.
 */
export default function Login({ onSignedIn }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!email.trim() || !password) {
      setError("Enter both email and password.");
      return;
    }

    setBusy(true);
    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (authError) {
        setError(authError.message);
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from("users")
        .select("role")
        .eq("user_id", data.user.id)
        .maybeSingle();

      if (profileError) {
        setError("Could not read your profile: " + profileError.message);
        await supabase.auth.signOut();
        return;
      }
      if (!profile) {
        setError("No profile row exists for this account.");
        await supabase.auth.signOut();
        return;
      }
      if (profile.role !== "Administrator") {
        setError(
          `This account has the "${profile.role}" role. The admin dashboard requires the "Administrator" role.`
        );
        await supabase.auth.signOut();
        return;
      }

      onSignedIn(data.user);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="login-view" onSubmit={handleSubmit}>
      <h2>GisingLang Admin</h2>
      <p className="hint">
        System Administrator access only. Sign in with an account whose role is{" "}
        <strong>Administrator</strong>.
      </p>

      <label htmlFor="email">Email</label>
      <input
        id="email"
        type="email"
        autoComplete="username"
        placeholder="admin@example.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <label htmlFor="password">Password</label>
      <input
        id="password"
        type="password"
        autoComplete="current-password"
        placeholder="••••••••"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <button type="submit" className="primary" disabled={busy}>
        {busy ? "Signing in…" : "Sign in"}
      </button>

      {error && <div className="msg error">{error}</div>}
    </form>
  );
}
