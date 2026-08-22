import { useMemo } from "react";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

const LEVELS = ["LAYER1", "LAYER2", "COMBINED"];
const COLORS = { LAYER1: "#f5a623", LAYER2: "#f57b23", COMBINED: "#e8443a" };

/**
 * Stacked daily counts per alert layer (FR8: anonymized aggregate metrics -
 * this shows only counts, never which driver an event belongs to).
 */
export default function EventsChart({ events }) {
  const { labels, datasets } = useMemo(() => {
    const byDay = {};
    for (const e of events) {
      if (!e.event_timestamp) continue;
      const day = String(e.event_timestamp).slice(0, 10);
      if (!byDay[day]) byDay[day] = { LAYER1: 0, LAYER2: 0, COMBINED: 0 };
      if (byDay[day][e.alert_level] !== undefined) byDay[day][e.alert_level] += 1;
    }
    const days = Object.keys(byDay).sort();
    return {
      labels: days,
      datasets: LEVELS.map((level) => ({
        label: level,
        data: days.map((d) => byDay[d][level]),
        backgroundColor: COLORS[level],
      })),
    };
  }, [events]);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: { stacked: true, grid: { color: "#232b35" }, ticks: { color: "#93a1b0" } },
      y: {
        stacked: true,
        beginAtZero: true,
        grid: { color: "#232b35" },
        ticks: { color: "#93a1b0", precision: 0 },
      },
    },
    plugins: { legend: { labels: { color: "#e8edf2", boxWidth: 12 } } },
  };

  return (
    <div className="panel">
      <h3>Drowsiness Events Over Time</h3>
      <p className="desc">
        Aggregate event counts per day, grouped by alert layer. Anonymized — no
        personally identifying data is shown.
      </p>
      <div className="chart-wrap">
        {labels.length === 0 ? (
          <div className="empty">No events recorded yet.</div>
        ) : (
          <Bar data={{ labels, datasets }} options={options} />
        )}
      </div>
    </div>
  );
}
