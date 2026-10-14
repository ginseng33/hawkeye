export function ScoreRing({ score, size = 128 }: { score: number | null; size?: number }) {
  const radius = (size - 12) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = score !== null ? Math.min(Math.max(score, 0), 100) / 100 : 0;
  const offset = circumference * (1 - pct);

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--border)"
          strokeWidth={8}
        />
        {score !== null && (
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="var(--primary)"
            strokeWidth={8}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{ transition: "stroke-dashoffset 400ms ease" }}
          />
        )}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display tabular-nums text-foreground" style={{ fontSize: size * 0.3 }}>
          {score !== null ? Math.round(score) : "—"}
        </span>
        <span className="font-technical text-[10px] text-muted-foreground">/ 100</span>
      </div>
    </div>
  );
}

export function SubScoreBar({ label, score }: { label: string; score: number | null }) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <span className="font-technical text-[11px] text-muted-foreground">{label}</span>
        <span className="font-technical tabular-nums text-[11px] text-foreground">
          {score !== null ? Math.round(score) : "—"}
        </span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: `${score !== null ? Math.min(Math.max(score, 0), 100) : 0}%` }}
        />
      </div>
    </div>
  );
}
