export function LoadingState() {
  return (
    <div
      className="panel animate-rise flex flex-col items-center justify-center gap-4 rounded-[28px] px-6 py-16 text-center"
      role="status"
      aria-live="polite"
    >
      <div
        className="h-12 w-12 animate-spin rounded-full border-4"
        style={{
          borderColor: "var(--line)",
          borderTopColor: "var(--accent)",
        }}
      />
      <div>
        <p
          className="font-display text-xl"
          style={{ color: "var(--ink)" }}
        >
          Собираем меню…
        </p>
        <p className="hint mt-1">Учитываем продукты, технику и ваши пожелания</p>
      </div>
    </div>
  );
}
