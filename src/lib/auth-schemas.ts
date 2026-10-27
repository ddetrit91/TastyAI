import { z } from "zod";

export const registerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Имя слишком короткое")
    .max(60, "Имя слишком длинное"),
  email: z.string().trim().email("Некорректный email").max(120),
  password: z
    .string()
    .min(8, "Пароль не короче 8 символов")
    .max(72, "Пароль слишком длинный"),
});

export const loginSchema = z.object({
  email: z.string().trim().email("Некорректный email").max(120),
  password: z.string().min(1, "Введите пароль").max(72),
});
