import { useState, useEffect, useCallback, useContext } from "react";
import { Bar, Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from "chart.js";
import CountUp from "react-countup";
import PropTypes from "prop-types";
import { FaUsers, FaBolt, FaDollarSign } from "react-icons/fa";
import { AuthContext } from "../../../context/authContext";
import { getAdminDashboard } from "../../../utils/API_SERVICE";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const MONTH_LABELS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const CURRENT_YEAR = new Date().getFullYear();
// Year picker for the bar chart: this year plus the four before it.
const YEAR_OPTIONS = Array.from({ length: 5 }, (_, i) => CURRENT_YEAR - i);

const ANNUAL_COLOR = "#16a7d9";
const MONTHLY_COLOR = "#5ad4ff";

const formatRevenue = (revenue) => {
  if (!revenue) return "$0";
  const amount = revenue.amountDollars ?? (revenue.amountCents ?? 0) / 100;
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: (revenue.currency || "usd").toUpperCase(),
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `$${Math.round(amount).toLocaleString()}`;
  }
};

const KpiCard = ({ icon, iconClass, label, value, meta, loading }) => (
  <div className="kpi-card">
    <span className={`kpi-icon ${iconClass || ""}`}>{icon}</span>
    <div className="flex-1">
      <p className="kpi-label">{label}</p>
      {loading ? (
        <div className="skeleton mt-2" style={{ height: 28, width: 96 }} />
      ) : (
        <p className="kpi-value">{value}</p>
      )}
      {meta && !loading && <p className="kpi-meta">{meta}</p>}
    </div>
  </div>
);

KpiCard.propTypes = {
  icon: PropTypes.node.isRequired,
  iconClass: PropTypes.string,
  label: PropTypes.string.isRequired,
  value: PropTypes.node,
  meta: PropTypes.string,
  loading: PropTypes.bool,
};

const Dashboard = () => {
  const { accessToken } = useContext(AuthContext);
  const [year, setYear] = useState(CURRENT_YEAR);
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchDashboard = useCallback(async () => {
    if (!accessToken) return;

    setLoading(true);
    setError("");
    try {
      const response = await getAdminDashboard(accessToken, year);
      setMetrics(response.data || null);
    } catch (err) {
      setMetrics(null);
      setError(
        err.status === 403
          ? "Dashboard metrics are available to Owner and Admin accounts only."
          : err.message || "Failed to load dashboard metrics"
      );
    } finally {
      setLoading(false);
    }
  }, [accessToken, year]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const totalUsers = metrics?.totalUsers ?? 0;
  const newSubscriptions = metrics?.newSubscriptions ?? 0;
  const totalMonthly = metrics?.totalMonthlySubscriptions ?? 0;
  const totalAnnual = metrics?.totalAnnualSubscriptions ?? 0;
  const totalActive = totalAnnual + totalMonthly;

  // The API returns one entry per month with its own label; fall back to a
  // fixed 12-month axis if the array comes back short or empty.
  const soldPerMonth = metrics?.subscriptionsSoldPerMonth ?? [];
  const barLabels =
    soldPerMonth.length > 0
      ? soldPerMonth.map((m) => m.label || MONTH_LABELS[(m.month || 1) - 1])
      : MONTH_LABELS;
  const barCounts =
    soldPerMonth.length > 0
      ? soldPerMonth.map((m) => m.count ?? 0)
      : Array(12).fill(0);

  const subscriptionData = {
    // Three-letter months keep the axis readable at this width.
    labels: barLabels.map((label) => label.slice(0, 3)),
    datasets: [
      {
        label: "Subscriptions sold",
        data: barCounts,
        backgroundColor: MONTHLY_COLOR,
        hoverBackgroundColor: ANNUAL_COLOR,
        borderRadius: 6,
        maxBarThickness: 38,
      },
    ],
  };

  const barOptions = {
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "#101a24",
        padding: 10,
        cornerRadius: 8,
        displayColors: false,
        callbacks: {
          title: (items) => barLabels[items[0].dataIndex],
          label: (item) =>
            `${item.parsed.y} subscription${item.parsed.y === 1 ? "" : "s"}`,
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        border: { display: false },
        ticks: { color: "#8494a8", font: { size: 11 } },
      },
      y: {
        beginAtZero: true,
        border: { display: false },
        grid: { color: "#eef1f5" },
        // Subscription counts are whole numbers.
        ticks: { precision: 0, color: "#8494a8", font: { size: 11 }, padding: 8 },
      },
    },
  };

  const planMixData = {
    labels: ["Annual", "Monthly"],
    datasets: [
      {
        data: [totalAnnual, totalMonthly],
        backgroundColor: [ANNUAL_COLOR, MONTHLY_COLOR],
        borderWidth: 0,
        hoverOffset: 6,
      },
    ],
  };

  const doughnutOptions = {
    maintainAspectRatio: false,
    cutout: "68%",
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "#101a24",
        padding: 10,
        cornerRadius: 8,
        callbacks: {
          label: (item) => {
            const share = totalActive
              ? Math.round((item.parsed / totalActive) * 100)
              : 0;
            return ` ${item.label}: ${item.parsed} (${share}%)`;
          },
        },
      },
    },
  };

  const planLegend = [
    { label: "Annual", value: totalAnnual, color: ANNUAL_COLOR },
    { label: "Monthly", value: totalMonthly, color: MONTHLY_COLOR },
  ];

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">
            Subscription and revenue overview across the ComeAway platform.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor="dashboard-year" className="text-muted text-sm">
            Year
          </label>
          <select
            id="dashboard-year"
            className="select"
            style={{ width: 110 }}
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            disabled={loading}
          >
            {YEAR_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && !loading && (
        <div className="alert alert-danger mb-6">
          <div className="flex-1">
            <p className="alert-title">Could not load metrics</p>
            <p className="mt-1">{error}</p>
          </div>
          <button
            type="button"
            onClick={fetchDashboard}
            className="btn btn-sm btn-danger-soft"
          >
            Retry
          </button>
        </div>
      )}

      <div className="kpi-grid mb-6">
        <KpiCard
          icon={<FaUsers size={17} />}
          label="Total Users"
          loading={loading}
          value={<CountUp end={totalUsers} duration={1.6} separator="," />}
          meta="All registered accounts"
        />
        <KpiCard
          icon={<FaBolt size={17} />}
          iconClass="kpi-icon-info"
          label="New Subscriptions"
          loading={loading}
          value={<CountUp end={newSubscriptions} duration={1.6} />}
          meta="This calendar month"
        />
        <KpiCard
          icon={<FaDollarSign size={17} />}
          iconClass="kpi-icon-success"
          label="Revenue"
          loading={loading}
          value={formatRevenue(metrics?.revenue)}
          meta={`Currency: ${(metrics?.revenue?.currency || "usd").toUpperCase()}`}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card lg:col-span-2">
          <div className="card-header">
            <div>
              <h2 className="card-title">Subscriptions Sold per Month</h2>
              <p className="card-description">
                New subscriptions created in {metrics?.meta?.year ?? year}
              </p>
            </div>
            <span className="badge badge-brand">
              {barCounts.reduce((sum, n) => sum + n, 0)} total
            </span>
          </div>
          <div className="card-body">
            {loading ? (
              <div className="skeleton chart-box" />
            ) : (
              <div className="chart-box">
                <Bar data={subscriptionData} options={barOptions} />
              </div>
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div>
              <h2 className="card-title">Plan Mix</h2>
              <p className="card-description">Active and trialing plans</p>
            </div>
          </div>
          <div className="card-body">
            {loading ? (
              <div className="skeleton chart-box-sm" />
            ) : totalActive === 0 ? (
              <div className="chart-box-sm flex items-center justify-center">
                <p className="empty-state">No active subscriptions yet</p>
              </div>
            ) : (
              <div className="chart-box-sm">
                <Doughnut data={planMixData} options={doughnutOptions} />
              </div>
            )}

            {!loading && (
              <div className="stack-sm mt-5">
                {planLegend.map((entry) => (
                  <div key={entry.label} className="row-between">
                    <span className="flex items-center gap-2 text-secondary text-sm">
                      <span
                        style={{
                          width: 9,
                          height: 9,
                          borderRadius: 999,
                          backgroundColor: entry.color,
                          display: "inline-block",
                        }}
                      />
                      {entry.label}
                    </span>
                    <span className="cell-strong text-sm">
                      {entry.value}
                      <span className="text-muted">
                        {totalActive
                          ? ` · ${Math.round((entry.value / totalActive) * 100)}%`
                          : ""}
                      </span>
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
