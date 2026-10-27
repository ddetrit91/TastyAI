export default function OfflinePage() {
  return (
    <div className="panel mx-auto mt-16 max-w-lg rounded-[28px] px-6 py-10 text-center">
      <h1 className="font-display text-3xl">Нет сети</h1>
      <p className="hint mt-3">
        TASTY AI нужен интернет для генерации рецептов. Проверьте соединение и
        обновите страницу.
      </p>
    </div>
  );
}
