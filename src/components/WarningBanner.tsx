interface WarningBannerProps {
  warnings: string[];
}

export function WarningBanner({ warnings }: WarningBannerProps) {
  if (!warnings.length) return null;

  return (
    <div
      className="animate-rise rounded-2xl border px-4 py-3"
      style={{
        borderColor: "var(--warn)",
        background: "var(--warn-bg)",
        color: "var(--warn)",
      }}
      role="status"
    >
      <p className="mb-2 text-sm font-semibold">Важно по безопасности</p>
      <ul className="space-y-1 text-sm">
        {warnings.map((w) => (
          <li key={w}>• {w}</li>
        ))}
      </ul>
    </div>
  );
}
