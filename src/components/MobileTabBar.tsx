"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { adminNavItem, primaryNav } from "@/components/nav";

export function MobileTabBar() {
  const pathname = usePathname();
  const { user } = useAuth();

  const items = [
    ...primaryNav,
    ...(user?.role === "admin" ? [adminNavItem] : []),
  ];

  return (
    <nav className="mobile-tabbar md:hidden" aria-label="Основная навигация">
      <div className="mobile-tabbar__inner">
        {items.map((item) => {
          const active = item.match(pathname);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`mobile-tabbar__item ${active ? "is-active" : ""}`}
              aria-current={active ? "page" : undefined}
            >
              <Icon className="h-5 w-5" strokeWidth={active ? 2.4 : 2} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
