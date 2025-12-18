"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff } from "lucide-react";
import PasswordStrengthMeter from "@/components/ui/PasswordStrength";

export default function ChangePasswordPage() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  /* ---------------- Password Rules ---------------- */
  const validatePassword = (password: string) => {
    return (
      password.length >= 8 &&
      /[A-Z]/.test(password) &&
      /[a-z]/.test(password) &&
      /[0-9]/.test(password) &&
      /[^A-Za-z0-9]/.test(password)
    );
  };

  const isPasswordStrong = validatePassword(newPassword);

  /* ---------------- Submit Handler ---------------- */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!isPasswordStrong) {
      setError(
        "Password must be at least 8 characters and include uppercase, lowercase, number, and special character."
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("New password and confirmation do not match.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/admin/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to change password.");
        setLoading(false);
        return;
      }

      setSuccess("Password changed successfully. Redirecting to login…");

      setTimeout(() => {
        window.location.href = "/admin/login";
      }, 2000);
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  /* ---------------- UI ---------------- */
  return (
    <div className="max-w-md mx-auto mt-16 p-6 bg-white border border-slate-200 rounded-2xl shadow-sm">
      <h1 className="text-xl font-semibold mb-2">Change Password</h1>
      <p className="text-sm text-slate-500 mb-6">
        For security reasons, you will be logged out after changing your
        password.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Current Password */}
        <div>
          <label className="text-sm font-medium">Current Password</label>
          <div className="relative mt-1">
            <input
              type={showCurrent ? "text" : "password"}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              className="w-full rounded-xl border border-slate-300 px-3 py-2 pr-10 text-sm focus:ring-2 focus:ring-orange-500 focus:outline-none"
            />
            <button
              type="button"
              aria-label={showCurrent ? "Hide password" : "Show password"}
              onClick={() => setShowCurrent((v) => !v)}
              className="absolute inset-y-0 right-3 flex items-center text-slate-500 hover:text-slate-700"
            >
              {showCurrent ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        {/* New Password */}
        <div>
          <label className="text-sm font-medium">New Password</label>
          <div className="relative mt-1">
            <input
              type={showNew ? "text" : "password"}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              className="w-full rounded-xl border border-slate-300 px-3 py-2 pr-10 text-sm focus:ring-2 focus:ring-orange-500 focus:outline-none"
            />
            <button
              type="button"
              aria-label={showNew ? "Hide password" : "Show password"}
              onClick={() => setShowNew((v) => !v)}
              className="absolute inset-y-0 right-3 flex items-center text-slate-500 hover:text-slate-700"
            >
              {showNew ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          {/* 🔐 Password Strength Meter */}
          <PasswordStrengthMeter password={newPassword} />
        </div>

        {/* Confirm Password */}
        <div>
          <label className="text-sm font-medium">Confirm New Password</label>
          <div className="relative mt-1">
            <input
              type={showConfirm ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="w-full rounded-xl border border-slate-300 px-3 py-2 pr-10 text-sm focus:ring-2 focus:ring-orange-500 focus:outline-none"
            />
            <button
              type="button"
              aria-label={showConfirm ? "Hide password" : "Show password"}
              onClick={() => setShowConfirm((v) => !v)}
              className="absolute inset-y-0 right-3 flex items-center text-slate-500 hover:text-slate-700"
            >
              {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        {/* Error / Success */}
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

        <Button
          type="submit"
          className="w-full"
          disabled={loading || !isPasswordStrong}
        >
          {loading ? "Updating..." : "Update Password"}
        </Button>
      </form>
    </div>
  );
}
