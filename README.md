# TASTY AI

Умный генератор рецептов: ужин из продуктов, которые уже есть дома, с учётом кухонной техники.

## Стек

- Next.js 16 (App Router) + TypeScript + Tailwind CSS
- **Hono** API (`/api/*`) — auth, recipes, admin
- Gemini API (серверно, ключ не попадает на клиент)
- Turso / libSQL + Drizzle (история, избранное, админка)
- next-themes (светлая кремово-оранжевая / тёмная)
- PWA (Serwist)
- Админка `/admin` (роль `admin`)

## Быстрый старт (локально)

```bash
npm install
cp .env.example .env.local
npm run dev
```

Откройте [http://localhost:3000](http://localhost:3000).

Без `GEMINI_API_KEY` приложение работает в **демо-режиме** с примерными рецептами.  
Без Turso локально используется файл `local.db` для истории и избранного.

## Подключение Gemini API

1. Создайте ключ в [Google AI Studio](https://aistudio.google.com/apikey).
2. В `.env.local` добавьте:

```env
GEMINI_API_KEY=ваш_ключ
# опционально
GEMINI_MODEL=gemini-2.0-flash
```

3. Перезапустите `npm run dev`.

Ключ читается только в Route Handlers на сервере.

## Turso

1. Создайте базу в [Turso](https://turso.tech/).
2. Получите URL и токен:

```bash
turso db show <имя> --url
turso db tokens create <имя>
```

3. Пропишите в `.env.local` / Vercel:

```env
TURSO_DATABASE_URL=libsql://...
TURSO_AUTH_TOKEN=...
```

Таблицы создаются автоматически при первом запросе.

## Деплой на Vercel

Импортируйте репозиторий в Vercel (Next.js), добавьте env: `GEMINI_API_KEY`, `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN` (и при необходимости `GEMINI_MODEL`, `ADMIN_BOOTSTRAP_EMAIL`), затем Deploy.

Первого админа можно создать локально: задайте `ADMIN_BOOTSTRAP_PASSWORD` в `.env.local` и выполните `npm run seed:admin` (пароль только в env, не в репозитории).

## Возможности

- Форма продуктов, техники, режима «только из имеющегося» / «можно докупить»
- 2–3 варианта рецептов, копирование, избранное, история
- Предупреждения по сомнительным/испорченным продуктам
- Адаптив, PWA-манифест, переключатель темы

## Скрипты

| Команда        | Описание              |
|----------------|-----------------------|
| `npm run dev`  | Локальная разработка  |
| `npm run build`| Продакшен-сборка      |
| `npm run start`| Запуск сборки         |
| `npm run lint` | ESLint                |
| `npm run seed:admin` | Создать/обновить admin (нужен `ADMIN_BOOTSTRAP_PASSWORD` в `.env.local`) |
