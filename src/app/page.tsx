import { Generator } from "@/components/Generator";

export default function HomePage() {
  return (
    <div className="space-y-8 sm:space-y-10">
      <section className="animate-rise max-w-2xl pt-2 sm:pt-4">
        <p className="hint mb-3">Генератор ужинов</p>
        <h1
          className="font-display text-[2.15rem] font-extrabold leading-[1.05] tracking-[-0.035em] sm:text-5xl md:text-[3.25rem]"
          style={{ color: "var(--ink)" }}
        >
          Что приготовим{" "}
          <span style={{ color: "var(--accent)" }}>сегодня</span>
        </h1>
        <p
          className="mt-4 max-w-xl text-base leading-relaxed sm:mt-5 sm:text-lg"
          style={{ color: "var(--ink-muted)" }}
        >
          Назовите продукты и доступную технику — получите несколько вариантов
          ужина с шагами, временем и ориентировочной калорийностью.
        </p>
      </section>

      <Generator />
    </div>
  );
}
