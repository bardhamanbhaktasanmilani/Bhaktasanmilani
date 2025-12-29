"use client";

import React, { useEffect, useState, useMemo, useRef } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  Download,
  TrendingUp,
  TrendingDown,
  FileSpreadsheet,
  Calendar,
  BarChart3,
  Activity,
} from "lucide-react";
import html2canvas from "html2canvas";



type DonationStatus = "PENDING" | "SUCCESS" | "FAILED" | "REFUNDED";
type MetricMode = "amount" | "count" | "stacked";
type Timeframe = "daily" | "monthly" | "yearly";
type DailyRange = 30 | 60 | 90;

type Donation = {
  id: string;
  paymentId: string | null;
  amount: number;
  status: DonationStatus;
  createdAt: string;
};

type ChartPoint = {
  key: string;
  label: string;
  totalAmount: number;
  count: number;
};

/* ---------------- Utils ---------------- */

const startOfDay = (d: Date) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
};


const localDateKey = (date: Date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

const formatAmount = (v: number) =>
  `₹ ${v.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

/* ---------------- Component ---------------- */

export default function AnalyticsPage() {
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);

  const [timeframe, setTimeframe] = useState<Timeframe>("daily");
  const [dailyRange, setDailyRange] = useState<DailyRange>(30);
  const [metric, setMetric] = useState<MetricMode>("amount");

  const [fromDate, setFromDate] = useState<string | null>(null);
  const [toDate, setToDate] = useState<string | null>(null);

  const chartRef = useRef<HTMLDivElement | null>(null);

  /* ---------------- Fetch ---------------- */

  useEffect(() => {
    fetch("/api/admin/donations", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => setDonations(d.donations || []))
      .finally(() => setLoading(false));
  }, []);

  /* ---------------- Core logic (UNCHANGED) ---------------- */

  const completed = useMemo(
    () => donations.filter((d) => d.status === "SUCCESS" && d.paymentId),
    [donations]
  );

  const dateFiltered = useMemo(() => {
    if (!fromDate || !toDate) return completed;
    const from = startOfDay(new Date(fromDate));
    const to = startOfDay(new Date(toDate));
    return completed.filter((d) => {
      const dt = startOfDay(new Date(d.createdAt));
      return dt >= from && dt <= to;
    });
  }, [completed, fromDate, toDate]);

  const chartData = useMemo<ChartPoint[]>(() => {
    const map = new Map<string, ChartPoint>();
    const now = startOfDay(new Date());
    let source = dateFiltered;

    // ---- Daily prefill (last N days) ----
    if (!fromDate && timeframe === "daily") {
      const start = new Date(now);
      start.setDate(start.getDate() - dailyRange + 1);

      for (let i = 0; i < dailyRange; i++) {
        const d = new Date(start);
        d.setDate(start.getDate() + i);
        const key = localDateKey(d);

        map.set(key, {
          key,
          label: d.toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
          }),
          totalAmount: 0,
          count: 0,
        });
      }

      source = dateFiltered.filter((d) => {
        const dt = startOfDay(new Date(d.createdAt));
        return dt >= start && dt <= now;
      });
    }

    // ---- Aggregate donations ----
    for (const d of source) {
      const date = new Date(d.createdAt);
      let key: string;
      let label: string;

      if (timeframe === "daily") {
        key = localDateKey(date);
        label = date.toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
        });
      } else if (timeframe === "monthly") {
        key = `${date.getFullYear()}-${date.getMonth() + 1}`;
        label = date.toLocaleDateString("en-IN", {
          month: "short",
          year: "numeric",
        });
      } else {
        key = String(date.getFullYear());
        label = key;
      }

      const e = map.get(key);
      if (e) {
        e.totalAmount += d.amount;
        e.count += 1;
      } else {
        map.set(key, {
          key,
          label,
          totalAmount: d.amount,
          count: 1,
        });
      }
    }

    return Array.from(map.values()).sort((a, b) =>
      a.key.localeCompare(b.key)
    );
  }, [dateFiltered, timeframe, dailyRange, fromDate]);

 

  const comparison30 = useMemo(() => {
    if (timeframe !== "daily" || dailyRange !== 30 || fromDate) return null;

    const now = startOfDay(new Date());
    const currStart = new Date(now);
    currStart.setDate(currStart.getDate() - 29);

    const prevStart = new Date(currStart);
    prevStart.setDate(prevStart.getDate() - 30);
    const prevEnd = new Date(currStart);
    prevEnd.setDate(prevEnd.getDate() - 1);

    const sum = (from: Date, to: Date) =>
      completed
        .filter((d) => {
          const dt = startOfDay(new Date(d.createdAt));
          return dt >= from && dt <= to;
        })
        .reduce((s, d) => s + d.amount, 0);

    const current = sum(currStart, now);
    const previous = sum(prevStart, prevEnd);
    const delta = previous ? ((current - previous) / previous) * 100 : 0;

    return { current, previous, delta };
  }, [completed, timeframe, dailyRange, fromDate]);

  /* ---------------- Exports ---------------- */

  const exportCSV = () => {
    const header = "Date,Total Amount,Donation Count\n";
    const rows = chartData
      .map((r) => `${r.label},${r.totalAmount},${r.count}`)
      .join("\n");

    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "donation-analytics.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
     
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="max-w-6xl mx-auto px-4 py-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-3 py-1 mb-2">
              <Activity className="h-3.5 w-3.5 text-sky-600" />
              <span className="text-[11px] uppercase tracking-[0.18em] text-sky-700">
                Analytics · Donations
              </span>
            </div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Donation Analytics
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Visual insights based on completed Razorpay transactions.
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={exportCSV}
              className="inline-flex items-center gap-2 rounded-full border border-slate-300 px-3 py-1.5 text-xs font-medium bg-white hover:bg-slate-50"
            >
              <FileSpreadsheet className="h-4 w-4" />
              CSV
            </button>
          </div>
        </div>
      </header>

  <section className="max-w-6xl mx-auto px-4 py-6 space-y-8">
 
  <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
    <div className="flex flex-wrap gap-3 items-center">
      {(["daily", "monthly", "yearly"] as Timeframe[]).map((t) => (
        <button
          key={t}
          onClick={() => setTimeframe(t)}
          className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
            timeframe === t
              ? "bg-slate-900 text-white"
              : "bg-slate-100 hover:bg-slate-200"
          }`}
        >
          {t.toUpperCase()}
        </button>
      ))}

      {timeframe === "daily" && !fromDate && (
        <div className="flex gap-2 flex-wrap">
          {[30, 60, 90].map((d) => (
            <button
              key={d}
              onClick={() => setDailyRange(d as DailyRange)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                dailyRange === d
                  ? "bg-sky-600 text-white"
                  : "bg-slate-100 hover:bg-slate-200"
              }`}
            >
              Last {d} days
            </button>
          ))}
        </div>
      )}

      <div className="flex gap-1 rounded-full border p-1 text-xs flex-wrap">
        {(["amount", "count", "stacked"] as MetricMode[]).map((m) => (
          <button
            key={m}
            onClick={() => setMetric(m)}
            className={`rounded-full px-3 py-1 font-semibold ${
              metric === m ? "bg-slate-900 text-white" : ""
            }`}
          >
            {m}
          </button>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-2 text-xs">
        <Calendar className="h-4 w-4 text-slate-500" />
        <input
          type="date"
          value={fromDate || ""}
          onChange={(e) => setFromDate(e.target.value || null)}
          className="border rounded px-2 py-1 w-full sm:w-auto"
        />
        <span>to</span>
        <input
          type="date"
          value={toDate || ""}
          onChange={(e) => setToDate(e.target.value || null)}
          className="border rounded px-2 py-1 w-full sm:w-auto"
        />
        {(fromDate || toDate) && (
          <button
            onClick={() => {
              setFromDate(null);
              setToDate(null);
            }}
            className="underline ml-2"
          >
            Clear
          </button>
        )}
      </div>
    </div>
  </div>


  {comparison30 && (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
        <p className="text-[11px] text-slate-500 uppercase">
          Current 30 Days
        </p>
        <p className="text-lg font-semibold mt-1">
          {formatAmount(comparison30.current)}
        </p>
      </div>
      <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
        <p className="text-[11px] text-slate-500 uppercase">
          Previous 30 Days
        </p>
        <p className="text-lg font-semibold mt-1">
          {formatAmount(comparison30.previous)}
        </p>
      </div>
      <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm flex items-center gap-2">
        {comparison30.delta >= 0 ? (
          <TrendingUp className="text-emerald-600" />
        ) : (
          <TrendingDown className="text-rose-600" />
        )}
        <span
          className={`text-lg font-semibold ${
            comparison30.delta >= 0
              ? "text-emerald-600"
              : "text-rose-600"
          }`}
        >
          {comparison30.delta.toFixed(1)}%
        </span>
      </div>
    </div>
  )}

  {/* Chart */}
  <div
    ref={chartRef}
    className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm h-80"
  >
    {loading ? (
      <div className="h-full flex items-center justify-center text-sm text-slate-500">
        Loading analytics…
      </div>
    ) : (
      <ResponsiveContainer width="100%" height="100%">
        {metric === "stacked" ? (
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="label" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="totalAmount" stackId="a" fill="#0f172a" />
            <Bar dataKey="count" stackId="a" fill="#38bdf8" />
          </BarChart>
        ) : (
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="label" />
            <YAxis />
            <Tooltip />
            <Line
              type="monotone"
              dataKey={metric === "amount" ? "totalAmount" : "count"}
              stroke="#0f172a"
              strokeWidth={2}
              dot={{ r: 3 }}
              animationDuration={600}
            />
          </LineChart>
        )}
      </ResponsiveContainer>
    )}
  </div>
</section>


    </main>
  );
}
