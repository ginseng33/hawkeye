export function ScorePill({ score }: { score: number | null }) {
  if (score === null) {
    return (
      <span className="font-technical tabular-nums inline-flex h-6 min-w-10 items-center justify-center rounded-full bg-muted px-2.5 text-[12px] text-muted-foreground">
        —
      </span>
    );
  }

  const isHigh = score >= 75;

  return (
    <span
      className={
        "font-technical tabular-nums inline-flex h-6 min-w-10 items-center justify-center rounded-full px-2.5 text-[12px] " +
        (isHigh ? "bezel-primary text-primary-foreground" : "bg-primary-tint text-primary")
      }
    >
      {Math.round(score)}
    </span>
  );
}
