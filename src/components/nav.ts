import { Heart, History, Shield, Sparkles, type LucideIcon } from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  match: (pathname: string) => boolean;
  adminOnly?: boolean;
};

export const primaryNav: NavItem[] = [
  {
    href: "/",
    label: "Генератор",
    icon: Sparkles,
    match: (p) => p === "/",
  },
  {
    href: "/history",
    label: "История",
    icon: History,
    match: (p) => p.startsWith("/history"),
  },
  {
    href: "/favorites",
    label: "Избранное",
    icon: Heart,
    match: (p) => p.startsWith("/favorites"),
  },
];

export const adminNavItem: NavItem = {
  href: "/admin",
  label: "Admin",
  icon: Shield,
  match: (p) => p.startsWith("/admin"),
  adminOnly: true,
};
