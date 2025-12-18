"use client";

import React from "react";
import clsx from "clsx";

type Strength = {
  label: string;
  color: string;
  score: number;
};

function calculateStrength(password: string): Strength {
  let score = 0;

  if (password.length >= 8) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 1) return { label: "Weak", color: "bg-red-500", score };
  if (score === 2) return { label: "Fair", color: "bg-orange-500", score };
  if (score === 3) return { label: "Good", color: "bg-yellow-500", score };
  return { label: "Strong", color: "bg-green-600", score };
}

type Props = {
  password: string;
};

export default function PasswordStrengthMeter({ password }: Props) {
  if (!password) return null;

  const strength = calculateStrength(password);

  return (
    <div className="mt-2">
      {/* Progress bars */}
      <div className="flex gap-1">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={clsx(
              "h-1.5 flex-1 rounded transition-all",
              strength.score >= i ? strength.color : "bg-gray-200"
            )}
          />
        ))}
      </div>

      {/* Label */}
      <p
        className={clsx(
          "mt-1 text-sm font-medium",
          strength.score <= 1 && "text-red-600",
          strength.score === 2 && "text-orange-600",
          strength.score === 3 && "text-yellow-600",
          strength.score >= 4 && "text-green-600"
        )}
      >
        Password strength: {strength.label}
      </p>

      {/* Hints */}
      {strength.score < 4 && (
        <ul className="mt-1 text-xs text-gray-500 list-disc list-inside">
          <li>At least 8 characters</li>
          <li>Uppercase & lowercase letters</li>
          <li>Number and special character</li>
        </ul>
      )}
    </div>
  );
}
