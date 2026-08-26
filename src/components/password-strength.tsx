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

function levelFor(score: number): Level {
  if (score <= 2) return { label: "Weak", bar: "bg-destructive", text: "text-destructive" };
  if (score <= 3) return { label: "Medium", bar: "bg-warning", text: "text-warning" };
  return { label: "Strong", bar: "bg-success", text: "text-success" };
}

/** Live password strength meter: coloured bar, label and unmet-rule checklist. */
export function PasswordStrength({ password }: { password: string }) {
  if (!password) return null;
  const met = RULES.map((rule) => rule.test(password));
  const score = met.filter(Boolean).length;
  const level = levelFor(score);

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
