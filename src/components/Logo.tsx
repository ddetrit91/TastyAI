"use client";

import { useId, type CSSProperties } from "react";

type LogoSize = "sm" | "md" | "lg" | "hero";

const markSize: Record<LogoSize, number> = {
  sm: 36,
  md: 42,
  lg: 56,
  hero: 72,
};

const wordSize: Record<LogoSize, string> = {
  sm: "text-xl sm:text-[1.35rem]",
  md: "text-2xl",
  lg: "text-[1.75rem]",
  hero: "text-[2.35rem] sm:text-[2.75rem]",
};

interface LogoProps {
  size?: LogoSize;
  showWordmark?: boolean;
  showTagline?: boolean;
  stacked?: boolean;
  className?: string;
  style?: CSSProperties;
}

/** Premium mark: ceramic bowl + rising aroma / AI spark */
export function LogoMark({
  size = 40,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  const uid = useId().replace(/:/g, "");
  const gBowl = `tasty-bowl-${uid}`;
  const gInner = `tasty-inner-${uid}`;
  const gSteam = `tasty-steam-${uid}`;
  const gShine = `tasty-shine-${uid}`;
  const fSoft = `tasty-soft-${uid}`;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      <defs>
        <linearGradient id={gBowl} x1="10" y1="4" x2="54" y2="60" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FFB06A" />
          <stop offset="0.42" stopColor="#E85D04" />
          <stop offset="1" stopColor="#A83800" />
        </linearGradient>
        <linearGradient id={gInner} x1="20" y1="28" x2="44" y2="54" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FFFFFF" />
          <stop offset="1" stopColor="#FFD9B8" />
        </linearGradient>
        <linearGradient id={gSteam} x1="32" y1="6" x2="32" y2="28" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FFE2C0" stopOpacity="0" />
          <stop offset="0.4" stopColor="#FFC089" stopOpacity="0.95" />
          <stop offset="1" stopColor="#E85D04" stopOpacity="0.12" />
        </linearGradient>
        <linearGradient id={gShine} x1="14" y1="8" x2="40" y2="36" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FFFFFF" stopOpacity="0.55" />
          <stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
        </linearGradient>
        <filter id={fSoft} x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2.5" stdDeviation="2.2" floodColor="#C44700" floodOpacity="0.35" />
        </filter>
      </defs>

      <g filter={`url(#${fSoft})`}>
        <rect x="2" y="2" width="60" height="60" rx="18" fill={`url(#${gBowl})`} />
        <path
          d="M8 18C14 8 28 6 34 10c-10 2-16 10-18 20-6-2-10-6-8-12Z"
          fill={`url(#${gShine})`}
        />
        <rect
          x="4.5"
          y="4.5"
          width="55"
          height="55"
          rx="16"
          stroke="rgba(255,255,255,0.32)"
          strokeWidth="1.15"
        />

        <path
          d="M24 26c0-5 3.2-7.5 3.2-11.2"
          stroke={`url(#${gSteam})`}
          strokeWidth="2.2"
          strokeLinecap="round"
        />
        <path
          d="M32 24c0-6.5 3.6-8.8 3.6-13.5"
          stroke={`url(#${gSteam})`}
          strokeWidth="2.4"
          strokeLinecap="round"
        />
        <path
          d="M40 26c0-5 3-7.2 3-11"
          stroke={`url(#${gSteam})`}
          strokeWidth="2.2"
          strokeLinecap="round"
        />

        <circle cx="32" cy="12.5" r="2.15" fill="#FFF7ED" />
        <path
          d="M32 8.1v1.7M32 15.2v1.7M28.3 12.5h1.7M34 12.5h1.7"
          stroke="#FFF7ED"
          strokeWidth="1.2"
          strokeLinecap="round"
          opacity="0.9"
        />

        <ellipse cx="32" cy="52.5" rx="13" ry="2.2" fill="#8B2E00" opacity="0.18" />
        <path
          d="M16 34.5c1.2 11.5 8.6 17.5 16 17.5s14.8-6 16-17.5H16Z"
          fill={`url(#${gInner})`}
        />
        <path d="M14.5 34.5h35" stroke="#FFF7ED" strokeWidth="3.2" strokeLinecap="round" />
        <path
          d="M22 41.5c2.4 2.8 6 4.4 10 4.4s7.6-1.6 10-4.4"
          stroke="#E85D04"
          strokeWidth="1.6"
          strokeLinecap="round"
          opacity="0.32"
        />
      </g>
    </svg>
  );
}

export function Logo({
  size = "md",
  showWordmark = true,
  showTagline = false,
  stacked = false,
  className = "",
  style,
}: LogoProps) {
  const px = markSize[size];

  return (
    <span
      className={`inline-flex ${
        stacked
          ? "flex-col items-center gap-3 text-center"
          : "items-center gap-2.5 sm:gap-3"
      } ${className}`}
      style={style}
    >
      <LogoMark size={px} className="logo-mark shrink-0" />
      {showWordmark && (
        <span
          className={`flex min-w-0 flex-col leading-none ${stacked ? "items-center" : ""}`}
        >
          <span
            className={`font-display font-extrabold tracking-[-0.04em] ${wordSize[size]}`}
            style={{ color: "var(--ink)" }}
          >
            TASTY<span style={{ color: "var(--accent)" }}> AI</span>
          </span>
          {showTagline && (
            <span
              className="logo-tagline mt-1.5 text-[0.7rem] font-medium tracking-[0.01em] sm:text-xs"
              style={{ color: "var(--ink-muted)" }}
            >
              умный ужин из того, что есть
            </span>
          )}
        </span>
      )}
    </span>
  );
}
