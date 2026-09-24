import { cn } from "@/lib/utils";

type Tone = "brand" | "good" | "warn" | "bad" | "muted" | "gradient";

const tones: Record<Tone, string> = {
  brand: "bg-brand",
  good: "bg-good",
  warn: "bg-warn",
  bad: "bg-bad",
  muted: "bg-muted-foreground/50",
  gradient: "bg-gradient-brand",
};

export function ProgressBar({
  value,
  tone = "brand",
  className,
}: {
  value: number;
  tone?: Tone;
  className?: string;
}) {
  return (
    <div className={cn("h-1.5 overflow-hidden rounded-full bg-border", className)}>
      <div
        className={cn("h-full rounded-full transition-[width] duration-500", tones[tone])}
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}
