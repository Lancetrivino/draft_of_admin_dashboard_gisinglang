export function fmtNum(value, digits) {
  return value == null ? "—" : Number(value).toFixed(digits);
}

export function fmtPercent(value) {
  return value == null ? "—" : (Number(value) * 100).toFixed(1) + "%";
}

export function fmtDate(ts) {
  return ts ? new Date(ts).toLocaleDateString() : "—";
}

export function fmtDateTime(ts) {
  if (!ts) return "—";
  const d = new Date(ts);
  return (
    d.toLocaleDateString() +
    " " +
    d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })
  );
}
