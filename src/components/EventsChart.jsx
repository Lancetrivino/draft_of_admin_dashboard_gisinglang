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
 * Stacked daily counts per alert layer (FR8: anonymized aggregate metrics).
 * `daily` comes from admin_daily_alert_counts(): rows of
 * { day, alert_level, event_count } - counts only, no driver or device.
 */
export default function EventsChart({ daily, days }) {
  const { labels, datasets } = useMemo(() => {
    const byDay = {};
    for (const row of daily) {
      const day = String(row.day);
      if (!byDay[day]) byDay[day] = { LAYER1: 0, LAYER2: 0, COMBINED: 0 };
      if (byDay[day][row.alert_level] !== undefined) {
        byDay[day][row.alert_level] += Number(row.event_count);
      }
    }
    const sorted = Object.keys(byDay).sort();
    return {
      labels: sorted,
      datasets: LEVELS.map((level) => ({
        label: level,
        data: sorted.map((d) => byDay[d][level]),
        backgroundColor: COLORS[level],
      })),
    };
  }, [daily]);

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
      <h3>Drowsiness Alerts Over Time</h3>
      <p className="desc">
        Aggregate alert counts per day (last {days} days), grouped by alert layer. Anonymized —
        no driver, device or sensor reading is shown.
      </p>
      <div className="chart-wrap">
        {labels.length === 0 ? (
          <div className="empty">No alerts in this period.</div>
        ) : (
          <Bar data={{ labels, datasets }} options={options} />
        )}
      </div>
    </div>
  );
}
