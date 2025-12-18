// components/admin/DonationsAdminPage.tsx
"use client";

import React, {
  useEffect,
  useState,
  useMemo,
  useCallback,
  FormEvent,
} from "react";
import dynamic from "next/dynamic";
import {
  Filter,
  RefreshCcw,
  LogOut,
  Users,
  IndianRupee,
  AlertTriangle,
  Search,
  SortAsc,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/logout/page";
import { Button } from "@/components/ui/button";

type DonationStatus = "PENDING" | "SUCCESS" | "FAILED" | "REFUNDED";

type Donation = {
  id: string;
  orderId: string;
  paymentId: string | null;
  signature: string | null;
  amount: number; // rupees
  currency: string;

  donorName: string;
  donorEmail: string;
  donorPhone: string;

  status: DonationStatus;
  createdAt: string;
  updatedAt: string;
};

type TopDonor = {
  name: string | null;
  email: string | null;
  phone?: string | null;
  totalAmount: number; // rupees
};

type SortOption =
  | "default"
  | "name-asc"
  | "name-desc"
  | "amount-asc"
  | "amount-desc";

// dynamic import of CSVLink (client-only)
const CSVLink = dynamic(
  () => import("react-csv").then((mod) => mod.CSVLink),
  { ssr: false }
);

export default function AdminDashboardPage() {
  const [donations, setDonations] = useState<Donation[]>([]);
  const [rawTopDonors, setRawTopDonors] = useState<TopDonor[]>([]);
  const [loading, setLoading] = useState(true);
  const [minAmount, setMinAmount] = useState("");
  const [maxAmount, setMaxAmount] = useState("");
  const [error, setError] = useState<string | null>(null);

  // applied filters
  const [appliedMin, setAppliedMin] = useState<number | null>(null);
  const [appliedMax, setAppliedMax] = useState<number | null>(null);

  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOption, setSortOption] = useState<SortOption>("default");

  const [logoutOpen, setLogoutOpen] = useState(false);

  // admin email (fetched if API available) — fallback to known default
  const [adminEmail, setAdminEmail] = useState("admin@trust.org");

  // mount guard: ensures we only render CSVLink (which creates blob URL) on the client *after* mount
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  // ------------------ Fetch logic ------------------

  const fetchDonations = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/admin/donations`, {
        credentials: "include",
      });

      if (res.status === 401) {
        window.location.href = "/admin/login";
        return;
      }

      const data = await res.json();
      setDonations(data.donations || []);
      setRawTopDonors(data.uniqueTopDonors || []);
    } catch (err) {
      console.error(err);
      setError("Failed to load donations. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDonations();
  }, [fetchDonations]);

  // Try to fetch admin info (non-breaking if endpoint missing)
  useEffect(() => {
    let mountedFlag = true;
    (async () => {
      try {
        const res = await fetch("/api/admin/me", {
          credentials: "include",
        });
        if (res.status === 401) {
          // if session expired, redirect to login
          window.location.href = "/admin/login";
          return;
        }
        if (res.ok) {
          const json = await res.json();
          if (mountedFlag && json?.email) {
            setAdminEmail(String(json.email));
          }
        }
      } catch (err) {
        // ignore — keep fallback email
      }
    })();
    return () => {
      mountedFlag = false;
    };
  }, []);

  const handleFilter = (e: FormEvent) => {
    e.preventDefault();

    let nextAppliedMin: number | null = null;
    let nextAppliedMax: number | null = null;

    if (minAmount !== "") {
      const n = Number(minAmount);
      if (!Number.isNaN(n)) nextAppliedMin = n;
    }

    if (maxAmount !== "") {
      const n = Number(maxAmount);
      if (!Number.isNaN(n)) nextAppliedMax = n;
    }

    setAppliedMin(nextAppliedMin);
    setAppliedMax(nextAppliedMax);
  };

  const handleResetFilters = () => {
    setMinAmount("");
    setMaxAmount("");
    setAppliedMin(null);
    setAppliedMax(null);
    fetchDonations();
  };

  const handleSearchSubmit = (e: FormEvent) => {
    e.preventDefault();
  };

  const performLogout = async () => {
    try {
      await fetch("/api/admin/logout", { method: "POST" });
    } catch (err) {
      console.error("Logout error", err);
    } finally {
      window.location.href = "/admin/login";
    }
  };

  // ------------------ Helpers ------------------

  const formatAmount = (amount: number) =>
    `₹ ${amount.toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  const digitsOnly = (s: string) => (s ? s.replace(/[^\d.]/g, "") : "");

  const completedDonations = useMemo(
    () =>
      donations.filter(
        (d) =>
          d.status === "SUCCESS" &&
          d.paymentId !== null &&
          d.paymentId.trim() !== ""
      ),
    [donations]
  );

  const stats = useMemo(() => {
    const totalCount = completedDonations.length;
    const totalAmount = completedDonations.reduce(
      (sum, d) => sum + d.amount,
      0
    );

    return { totalCount, totalAmount };
  }, [completedDonations]);

  // Top donors aggregation
  const topDonors = useMemo(() => {
    if (!completedDonations || completedDonations.length === 0) {
      return (rawTopDonors || [])
        .map((r) => ({
          name: r.name ?? null,
          email: r.email ?? null,
          phone: undefined,
          totalAmount: r.totalAmount ?? 0,
        }))
        .sort((a, b) => b.totalAmount - a.totalAmount)
        .slice(0, 3);
    }

    const map = new Map<string, TopDonor>();

    for (const d of completedDonations) {
      const email = d.donorEmail ? d.donorEmail.trim().toLowerCase() : "";
      const phone = d.donorPhone ? d.donorPhone.trim() : "";
      const name = d.donorName ? d.donorName.trim() : "";

      let key = email || phone || name || `anonymous`;

      const existing = map.get(key);
      if (existing) {
        existing.totalAmount += d.amount;
        if (!existing.email && email) existing.email = email;
        if (!existing.name && name) existing.name = name;
        if (!existing.phone && phone) existing.phone = phone;
      } else {
        map.set(key, {
          name: name || null,
          email: email || null,
          phone: phone || null,
          totalAmount: d.amount,
        });
      }
    }

    const arr = Array.from(map.values()).sort((a, b) => b.totalAmount - a.totalAmount);

    return arr.slice(0, 3);
  }, [completedDonations, rawTopDonors]);

  // ------------------ Highlight helper (supports caseSensitive flag) ------------------
  const highlightText = (text: string, query: string, caseSensitive = false) => {
    if (!query) return text;
    const q = query.toString();
    const original = text ?? "";

    if (caseSensitive) {
      const idxCS = original.indexOf(q);
      if (idxCS !== -1) {
        const before = original.slice(0, idxCS);
        const match = original.slice(idxCS, idxCS + q.length);
        const after = original.slice(idxCS + q.length);
        return (
          <>
            {before}
            <span className="font-semibold bg-yellow-100 text-yellow-900 rounded-sm px-0.5">{match}</span>
            {after}
          </>
        );
      }
    } else {
      const lowerText = original.toLowerCase();
      const lowerQuery = q.toLowerCase();
      const idx = lowerText.indexOf(lowerQuery);
      if (idx !== -1) {
        const before = original.slice(0, idx);
        const match = original.slice(idx, idx + q.length);
        const after = original.slice(idx + q.length);
        return (
          <>
            {before}
            <span className="font-semibold bg-yellow-100 text-yellow-900 rounded-sm px-0.5">{match}</span>
            {after}
          </>
        );
      }
    }

    const queryDigits = digitsOnly(q);
    if (!queryDigits) return original;

    const originalDigitsChars: string[] = [];
    const originalDigitPositions: number[] = [];
    for (let i = 0; i < original.length; i++) {
      const ch = original[i];
      if (/\d|\./.test(ch)) {
        originalDigitsChars.push(ch);
        originalDigitPositions.push(i);
      }
    }
    const originalDigits = originalDigitsChars.join("");
    const foundAt = originalDigits.indexOf(queryDigits);
    if (foundAt === -1) return original;

    const startDigitPos = originalDigitPositions[foundAt];
    const endDigitPos =
      originalDigitPositions[foundAt + queryDigits.length - 1] ?? startDigitPos;

    const before = original.slice(0, startDigitPos);
    const match = original.slice(startDigitPos, endDigitPos + 1);
    const after = original.slice(endDigitPos + 1);

    return (
      <>
        {before}
        <span className="font-semibold bg-yellow-100 text-yellow-900 rounded-sm px-0.5">{match}</span>
        {after}
      </>
    );
  };

  // ------------------ Core processing: filter + search + sort ------------------

  const processedDonations = useMemo(() => {
    let list = [...completedDonations];

    if (appliedMin !== null) {
      list = list.filter((d) => d.amount >= appliedMin);
    }
    if (appliedMax !== null) {
      list = list.filter((d) => d.amount <= appliedMax);
    }

    list.sort((a, b) => {
      switch (sortOption) {
        case "name-asc": {
          const nameA = (a.donorName || "").toLowerCase();
          const nameB = (b.donorName || "").toLowerCase();
          return nameA.localeCompare(nameB);
        }
        case "name-desc": {
          const nameA = (a.donorName || "").toLowerCase();
          const nameB = (b.donorName || "").toLowerCase();
          return nameB.localeCompare(nameA);
        }
        case "amount-asc":
          return a.amount - b.amount;
        case "amount-desc":
          return b.amount - a.amount;
        case "default":
        default:
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
      }
    });

    const q = searchQuery.trim();
    if (!q) return list;

    const qLower = q.toLowerCase();
    const qDigits = digitsOnly(q);

    return list.filter((d) => {
      const createdDate = new Date(d.createdAt);
      const createdYear = createdDate.getFullYear().toString();
      const createdDisplay = createdDate.toLocaleString("en-IN");

      // Case-insensitive fields (name/email/phone/date)
      const ciFields = [
        d.donorName || "",
        d.donorEmail || "",
        d.donorPhone || "",
        createdYear,
        createdDisplay,
      ];

      const textMatch = ciFields.some((field) =>
        field.toLowerCase().includes(qLower)
      );
      if (textMatch) return true;

      // CASE-SENSITIVE search for orderId and paymentId (exact-case includes)
      if (d.orderId && d.orderId.includes(q)) return true;
      if (d.paymentId && d.paymentId.includes(q)) return true;

      // Numeric match for amount (digits-only)
      if (qDigits) {
        const amountRaw = d.amount.toString(); // e.g., "5000"
        if (amountRaw.includes(qDigits)) return true;

        const formatted = formatAmount(d.amount); // e.g., "₹ 5,000.00"
        const formattedDigits = digitsOnly(formatted); // "5000.00"
        if (formattedDigits.includes(qDigits)) return true;
      }

      return false;
    });
  }, [completedDonations, sortOption, appliedMin, appliedMax, searchQuery]);

  const hasSearch = searchQuery.trim().length > 0;

  const handleSearchInputChange = (value: string) => {
    setSearchInput(value);
    setSearchQuery(value);
  };

  // ------------------ CSV generation fallback (client-side) ------------------

  const buildCsvRows = () =>
    processedDonations.map((d) => ({
      Donor: d.donorName || "Anonymous",
      Email: d.donorEmail || "-",
      Phone: d.donorPhone || "-",
      Amount: formatAmount(d.amount),
      Status: "SUCCESS",
      OrderId: d.orderId || "-",
      PaymentId: d.paymentId || "-",
      Created: new Date(d.createdAt).toLocaleString("en-IN"),
    }));

  const downloadCsvClient = (rows: Record<string, any>[]) => {
    if (!rows || rows.length === 0) {
      // still produce header-only CSV
      const header = ["Donor", "Email", "Phone", "Amount", "Status", "OrderId", "PaymentId", "Created"];
      const csv = header.join(",") + "\n";
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.setAttribute("download", "donations.csv");
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      return;
    }

    // escape CSV fields
    const escape = (v: any) => {
      if (v === null || v === undefined) return '""';
      const s = String(v);
      return '"' + s.replace(/"/g, '""') + '"';
    };

    const headers = Object.keys(rows[0]);
    const lines = [headers.map(escape).join(",")];
    for (const row of rows) {
      lines.push(headers.map((h) => escape(row[h])).join(","));
    }
    const csv = lines.join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.setAttribute("download", "donations.csv");
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // ------------------ UI (kept intact) ------------------

  return (
    <>
      <main className="min-h-screen bg-slate-50 text-slate-900">
        <header className="border-b border-slate-200 bg-white/80 backdrop-blur">
          <div className="max-w-6xl mx-auto px-4 py-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-3 py-1 mb-2">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[11px] uppercase tracking-[0.18em] text-orange-700">
                  Admin · Donations
                </span>
              </div>
              <h1 className="text-2xl font-semibold tracking-tight">
                Donation Control Center
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Showing only fully completed donations settled via Razorpay.
              </p>
            </div>

            <div className="flex flex-col items-end gap-2">
              <span className="rounded-full bg-slate-50 border border-slate-200 px-3 py-1 text-[11px] text-slate-700 flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                <span>Logged in as:</span>
                <span className="font-semibold">{adminEmail}</span>
              </span>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={() =>
                    (window.location.href = "/admin/dashboard/change-password")
                  }
                >
                  Change Password
                </Button>

                {/* NEW: Change Email button */}
                <Button
                  variant="outline"
                  onClick={() => (window.location.href = "/admin/dashboard/change-email")}
                >
                  Change Email
                </Button>

                <button
                  onClick={() => setLogoutOpen(true)}
                  className="inline-flex items-center gap-2 rounded-full border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-800 bg-white hover:bg-slate-50 hover:border-slate-400 transition-colors"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  Logout
                </button>
              </div>
            </div>
          </div>
        </header>

        <section className="max-w-6xl mx-auto px-4 py-6 space-y-8">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 flex items-center justify-between shadow-sm">
              <div>
                <p className="text-[11px] text-slate-500 uppercase tracking-wide">
                  Completed Donations
                </p>
                <p className="text-xl font-semibold mt-1">
                  {stats.totalCount.toLocaleString("en-IN")}
                </p>
              </div>
              <div className="rounded-full bg-orange-50 border border-orange-100 p-2">
                <Users className="h-4 w-4 text-orange-500" />
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 flex items-center justify-between shadow-sm">
              <div>
                <p className="text-[11px] text-slate-500 uppercase tracking-wide">
                  Total Amount (Razorpay)
                </p>
                <p className="text-lg font-semibold mt-1 text-slate-900">
                  {formatAmount(stats.totalAmount)}
                </p>
              </div>
              <div className="rounded-full bg-emerald-50 border border-emerald-100 p-2">
                <IndianRupee className="h-4 w-4 text-emerald-500" />
              </div>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-[1.7fr,1.3fr]">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold flex items-center gap-2">
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-50 border border-slate-200">
                    <Filter className="h-3 w-3 text-slate-500" />
                  </span>
                  Filter by Amount
                </h2>
                {loading && (
                  <span className="text-[11px] text-slate-500 flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-orange-400 animate-pulse" />
                    Loading...
                  </span>
                )}
              </div>

              <form onSubmit={handleFilter} className="flex flex-col gap-3 sm:flex-row sm:items-end">
                <div className="flex-1">
                  <label className="block text-[11px] mb-1 text-slate-500">Min Amount (₹)</label>
                  <input
                    type="number"
                    min={0}
                    value={minAmount}
                    onChange={(e) => setMinAmount(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    placeholder="e.g. 300"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-[11px] mb-1 text-slate-500">Max Amount (₹)</label>
                  <input
                    type="number"
                    min={0}
                    value={maxAmount}
                    onChange={(e) => setMaxAmount(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    placeholder="e.g. 2000"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="mt-1 sm:mt-0 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:shadow disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    Apply Filter
                  </button>
                  <button
                    type="button"
                    onClick={handleResetFilters}
                    disabled={loading}
                    className="mt-1 sm:mt-0 inline-flex items-center gap-2 rounded-full border border-slate-300 px-3 py-2 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    <RefreshCcw className="h-3 w-3" />
                    Reset
                  </button>
                </div>
              </form>

              {error && (
                <p className="mt-3 text-xs text-red-700 bg-red-50 border border-red-200 rounded-xl px-3 py-2 flex items-center gap-2">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  <span>{error}</span>
                </p>
              )}
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold">Top Donors (by total amount)</h2>
                {topDonors.length > 0 && (
                  <span className="text-[11px] text-slate-500">
                    Showing top {topDonors.length} supporter{topDonors.length > 1 && "s"}
                  </span>
                )}
              </div>

              {topDonors.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-3 py-4 text-xs text-slate-500 text-center">
                  When donations start flowing in, your most generous devotees will appear here.
                </div>
              ) : (
                <ul className="space-y-2 text-xs">
                  {topDonors.map((d, idx) => (
                    <li key={`${d.email || d.name || "donor"}-${idx}`} className="flex items-center justify-between rounded-xl bg-slate-50 border border-slate-200 px-3 py-2">
                      <div className="flex items-center gap-3">
                        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white border border-slate-200 text-[11px] font-semibold text-slate-700">
                          #{idx + 1}
                        </span>
                        <div>
                          <p className="font-semibold text-slate-900">{d.name || d.email || "Anonymous Devotee"}</p>
                          <p className="text-[11px] text-slate-500">{d.email ?? d.phone ?? ""}</p>
                        </div>
                      </div>
                      <p className="text-xs font-semibold text-emerald-600">{formatAmount(d.totalAmount)}</p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-4">
              <div>
                <h2 className="text-sm font-semibold">Completed Donations</h2>
                <p className="text-[11px] text-slate-500 mt-1">Only successful Razorpay transactions that have been fully captured and settled.</p>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <form onSubmit={handleSearchSubmit} className="flex items-center gap-1">
                  <div className="flex items-center rounded-full border border-slate-300 bg-slate-50 px-3 py-1.5">
                    <Search className="h-3.5 w-3.5 text-slate-500 mr-2" />
                    <input
                      type="text"
                      value={searchInput}
                      onChange={(e) => handleSearchInputChange(e.target.value)}
                      placeholder="Search by name, email, year, amount..."
                      className="bg-transparent text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none w-48 sm:w-64"
                    />
                  </div>
                  <button type="submit" className="ml-2 inline-flex items-center gap-1 rounded-full bg-slate-900 text-white text-xs font-medium px-3 py-1.5 hover:bg-slate-800">
                    Search
                  </button>
                </form>

                <div className="flex items-center gap-1">
                  <div className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-slate-50 px-3 py-1.5">
                    <SortAsc className="h-3.5 w-3.5 text-slate-500" />
                    <select value={sortOption} onChange={(e) => setSortOption(e.target.value as SortOption)} className="bg-transparent text-xs text-slate-800 focus:outline-none">
                      <option value="default">Newest first</option>
                      <option value="name-asc">Name · A → Z</option>
                      <option value="name-desc">Name · Z → A</option>
                      <option value="amount-asc">Amount · Low → High</option>
                      <option value="amount-desc">Amount · High → Low</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {processedDonations.length === 0 && !loading ? (
              <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
                {hasSearch ? (
                  <>
                    No search results found for <span className="font-semibold">&quot;{searchQuery}&quot;</span>.
                  </>
                ) : (
                  <>No completed donations found for the current filters.</>
                )}
              </div>
            ) : (
              <div className="relative max-h-[520px] overflow-auto rounded-xl border border-slate-200">
                <table className="min-w-full text-xs">
                  <thead className="sticky top-0 z-10 bg-slate-50/95 backdrop-blur border-b border-slate-200">
                    <tr className="text-[11px] text-slate-500">
                      <th className="text-left px-3 py-2 font-medium">Donor</th>
                      <th className="text-left px-3 py-2 font-medium">Email</th>
                      <th className="text-left px-3 py-2 font-medium">Phone</th>
                      <th className="text-left px-3 py-2 font-medium">Amount</th>
                      <th className="text-left px-3 py-2 font-medium">Status</th>
                      <th className="text-left px-3 py-2 font-medium">Order ID</th>
                      <th className="text-left px-3 py-2 font-medium">Payment ID</th>
                      <th className="text-left px-3 py-2 font-medium">Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {processedDonations.map((d, index) => {
                      const createdDate = new Date(d.createdAt);
                      const createdDisplay = createdDate.toLocaleString("en-IN");

                      return (
                        <tr key={d.id ?? index} className="border-b border-slate-100 last:border-0 odd:bg-white even:bg-slate-50 hover:bg-slate-100 transition-colors">
                          <td className="px-3 py-2 align-top">
                            <div className="flex flex-col">
                              <span className="font-semibold text-slate-900">
                                {highlightText(d.donorName || "Anonymous", searchQuery)}
                              </span>
                            </div>
                          </td>
                          <td className="px-3 py-2 align-top text-slate-800">{highlightText(d.donorEmail || "-", searchQuery)}</td>
                          <td className="px-3 py-2 align-top text-slate-800">{highlightText(d.donorPhone || "-", searchQuery)}</td>
                          <td className="px-3 py-2 align-top font-semibold text-slate-900 whitespace-nowrap">{highlightText(formatAmount(d.amount), searchQuery)}</td>
                          <td className="px-3 py-2 align-top">
                            <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold border bg-emerald-50 text-emerald-700 border-emerald-200">
                              <span className="h-1.5 w-1.5 rounded-full bg-current opacity-90" />
                              SUCCESS
                            </span>
                          </td>
                          <td className="px-3 py-2 align-top text-slate-800 max-w-[160px] truncate">
                            {highlightText(d.orderId || "-", searchQuery, true)}
                          </td>
                          <td className="px-3 py-2 align-top text-slate-800 max-w-[160px] truncate">
                            {highlightText(d.paymentId || "-", searchQuery, true)}
                          </td>
                          <td className="px-3 py-2 align-top text-slate-800 whitespace-nowrap">{highlightText(createdDisplay, searchQuery)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {loading && (
                  <div className="absolute inset-x-0 bottom-0 flex justify-center pb-2 pointer-events-none">
                    <div className="inline-flex items-center gap-2 rounded-full bg-white/95 border border-slate-200 px-3 py-1.5 text-[11px] text-slate-600 shadow-sm">
                      <span className="h-1.5 w-1.5 rounded-full bg-orange-400 animate-ping" />
                      Fetching latest donations...
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* CSV Download Button */}
          <div className="mt-4 flex justify-end">
            {mounted ? (
              // when mounted we can safely render the CSVLink (client-only dynamic import)
              <CSVLink
                data={buildCsvRows()}
                filename={"donations.csv"}
                // pass className to CSVLink's child anchor is not guaranteed; render child Button for consistency
              >
                <Button className="bg-blue-500 text-white px-4 py-2 rounded-full">
                  Download CSV
                </Button>
              </CSVLink>
            ) : (
              // fallback for the very brief moment before mount: render a simple button that will generate CSV client-side
              <button
                onClick={() => downloadCsvClient(buildCsvRows())}
                className="bg-blue-500 text-white px-4 py-2 rounded-full inline-flex items-center justify-center"
                aria-label="Download CSV (client fallback)"
                type="button"
              >
                Download CSV
              </button>
            )}
          </div>
        </section>
      </main>

      <AlertDialog open={logoutOpen} onOpenChange={setLogoutOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Log out of admin dashboard?</AlertDialogTitle>
            <AlertDialogDescription>
              You will be signed out of the admin donation console. You can log in again anytime using your admin credentials.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700 text-white" onClick={performLogout}>
              Logout
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
