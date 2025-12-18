// app/admin/change-email/page.tsx
"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff } from "lucide-react";

export default function ChangeEmailPage() {
  const [password, setPassword] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!newEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
      setError("Please enter a valid email address.");
      return;
    }

    if (!password) {
      setError("Please enter your current password for verification.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/admin/change-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ password, newEmail }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data?.error || "Failed to update email.");
        setLoading(false);
        return;
      }

      setSuccess("Email changed successfully — you will be redirected to login.");
      setTimeout(() => {
        window.location.href = "/admin/login";
      }, 1700);
    } catch (err) {
      console.error(err);
      setError("Network error, please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-16 p-6 bg-white border border-slate-200 rounded-2xl shadow-sm">
      <h1 className="text-xl font-semibold mb-2">Change Email</h1>
      <p className="text-sm text-slate-500 mb-6">
        For security reasons, you will be logged out after changing your email.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-sm font-medium">New Email Address</label>
          <input
            type="email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            required
            className="w-full mt-1 rounded-xl border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="text-sm font-medium">Current Password</label>
          <div className="relative mt-1">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full rounded-xl border border-slate-300 px-3 py-2 pr-10 text-sm focus:ring-2 focus:ring-orange-500 focus:outline-none"
            />
            <button
              type="button"
              aria-label={showPassword ? "Hide password" : "Show password"}
              onClick={() => setShowPassword((v) => !v)}
              className="absolute inset-y-0 right-3 flex items-center text-slate-500 hover:text-slate-700"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        {success && (
          <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
            {success}
          </p>
        )}

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Updating..." : "Update Email"}
        </Button>
      </form>
    </div>
  );
}
