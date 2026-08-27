import { useState, useEffect, useCallback, useContext } from "react";
import { Bar, Pie } from "react-chartjs-2";
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

  const userTypesData = {
    labels: ["Annual", "Monthly"],
    datasets: [
      {
        data: [totalAnnual, totalMonthly],
        backgroundColor: ["#5AD4FF", "#76e8b9"],
        hoverBackgroundColor: ["#5AD4FF", "#76e8b9"],
      },
    ],
  };

  const subscriptionData = {
    labels: barLabels,
    datasets: [
      {
        label: `Subscriptions Sold (${metrics?.meta?.year ?? year})`,
        data: barCounts,
        backgroundColor: "rgba(75, 192, 192, 0.2)",
        borderColor: "rgba(75, 192, 192, 1)",
        borderWidth: 1,
      },
    ],
  };

  const barOptions = {
    scales: {
      y: {
        beginAtZero: true,
        // Subscription counts are whole numbers.
        ticks: { precision: 0 },
      },
    },
  };

  const hasPieData = totalAnnual + totalMonthly > 0;

  return (
    <div className="text-center p-10 bg-gray-100 min-h-screen">
      <h1 className="font-bold text-4xl mb-4 text-gray-800">Dashboard</h1>

      {loading && (
        <p className="text-gray-500 mb-6">Loading dashboard metrics...</p>
      )}

      {error && !loading && (
        <div className="max-w-2xl mx-auto mb-8 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
          <p>{error}</p>
          <button
            onClick={fetchDashboard}
            className="mt-2 underline font-medium hover:text-red-800"
          >
            Try again
          </button>
        </div>
      )}

      <div className="flex justify-end items-center gap-2 mb-6">
        <label htmlFor="dashboard-year" className="text-sm text-gray-600">
          Year
        </label>
        <select
          id="dashboard-year"
          className="px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
        <div className="bg-white rounded-lg shadow-lg p-5">
          <h2 className="font-bold text-xl mb-3">
            Subscriptions (Annual / Monthly)
          </h2>
          {hasPieData ? (
            <Pie data={userTypesData} />
          ) : (
            <p className="text-gray-400 py-10 text-sm">
              No active subscriptions to chart
            </p>
          )}
        </div>
        <div className="bg-white rounded-lg shadow-lg p-5 col-span-2">
          <h2 className="font-bold text-xl mb-3">
            Subscription Sold per Month
          </h2>
          <Bar data={subscriptionData} options={barOptions} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mt-10">
        <div className="bg-white rounded-lg shadow-lg p-5">
          <h2 className="font-bold text-xl mb-3">Total Users</h2>
          <p className="text-3xl font-bold">
            <CountUp end={totalUsers} duration={2.5} />
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-lg p-5">
          <h2 className="font-bold text-xl mb-3">New Subscriptions</h2>
          <p className="text-3xl font-bold">
            <CountUp end={newSubscriptions} duration={2.5} />
          </p>
          <p className="text-xs text-gray-400 mt-1">This month</p>
        </div>
        <div className="bg-white rounded-lg shadow-lg p-5">
          <h2 className="font-bold text-xl mb-3">Revenue</h2>
          <p className="text-3xl font-bold">
            {formatRevenue(metrics?.revenue)}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
