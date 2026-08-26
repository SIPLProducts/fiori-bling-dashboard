import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

type StrengthRule = { label: string; test: (pw: string) => boolean };

const RULES: StrengthRule[] = [
  { label: "At least 8 characters", test: (pw) => pw.length >= 8 },
  { label: "At least 12 characters", test: (pw) => pw.length >= 12 },
  { label: "Uppercase and lowercase letters", test: (pw) => /[a-z]/.test(pw) && /[A-Z]/.test(pw) },
  { label: "Contains a number", test: (pw) => /\d/.test(pw) },
  { label: "Contains a symbol", test: (pw) => /[^A-Za-z0-9]/.test(pw) },
];

type Level = { label: string; bar: string; text: string };

const COMMON_BASES = [
  "password", "passwd", "admin", "welcome", "qwerty", "letmein", "login",
  "changeme", "secret", "master", "sharvi", "nexus", "sapuser", "sap123",
  "iloveyou", "dragon", "monkey", "football", "abc123", "user", "demo",
];

/** True when the password is a common/guessable pattern the auth backend would also reject. */
export function isCommonPassword(pw: string): boolean {
  const normalized = pw.toLowerCase().replace(/[^a-z0-9]/g, "");
  if (/^(.)\1+$/.test(normalized)) return true; // all same character
  if (/^(012345|123456|234567|345678|456789|987654|abcdef)/.test(normalized)) return true;
  const base = normalized.replace(/[0-9]+$/, "");
  return COMMON_BASES.includes(base) || COMMON_BASES.some((word) => base.startsWith(word) && base.length <= word.length + 2);
}

function levelFor(score: number, common: boolean): Level {
  if (common || score <= 2) return { label: "Weak", bar: "bg-destructive", text: "text-destructive" };
  if (score <= 3) return { label: "Medium", bar: "bg-warning", text: "text-warning" };
  return { label: "Strong", bar: "bg-success", text: "text-success" };
}

/** Live password strength meter: coloured bar, label and unmet-rule checklist. */
export function PasswordStrength({ password }: { password: string }) {
  if (!password) return null;
  const common = isCommonPassword(password);
  const met = RULES.map((rule) => rule.test(password));
  const score = met.filter(Boolean).length;
  const level = levelFor(score, common);

  return (
    <div className="mt-2 space-y-1.5" aria-live="polite">
      <div className="flex items-center gap-2">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
          <div
            className={cn("h-full rounded-full transition-all", level.bar)}
            style={{ width: `${Math.max((score / RULES.length) * 100, 8)}%` }}
          />
        </div>
        <span className={cn("text-xs font-medium", level.text)}>{level.label}</span>
      </div>
      {common ? (
        <p className="flex items-center gap-1.5 text-[11px] text-destructive" aria-live="polite">
          <X className="h-3 w-3" />
          This password is too common — please choose a different one
        </p>
      ) : null}
      <ul className="grid grid-cols-1 gap-0.5">
        {RULES.map((rule, i) => (
          <li
            key={rule.label}
            className={cn(
              "flex items-center gap-1.5 text-[11px]",
              met[i] ? "text-success" : "text-muted-foreground",
            )}
          >
            {met[i] ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
            {rule.label}
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Live match hint for the confirm-password field. */
export function PasswordMatchHint({
  password,
  confirmPassword,
}: {
  password: string;
  confirmPassword: string;
}) {
  if (!confirmPassword) return null;
  const match = password === confirmPassword;
  return (
    <p
      className={cn(
        "mt-1.5 flex items-center gap-1.5 text-[11px]",
        match ? "text-success" : "text-destructive",
      )}
      aria-live="polite"
    >
      {match ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
      {match ? "Passwords match" : "Passwords do not match"}
    </p>
  );
}
