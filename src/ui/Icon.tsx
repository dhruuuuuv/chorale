/** A small authored icon set: 20px grid, 1.75 stroke, round joins. */
const PATHS = {
  play: <path d="M6.5 4.2v11.6a.6.6 0 0 0 .9.5l9.3-5.8a.6.6 0 0 0 0-1L7.4 3.7a.6.6 0 0 0-.9.5Z" fill="currentColor" stroke="none" />,
  pause: (
    <g fill="currentColor" stroke="none">
      <rect x="5" y="4" width="3.6" height="12" rx=".8" />
      <rect x="11.4" y="4" width="3.6" height="12" rx=".8" />
    </g>
  ),
  stepBack: <path d="M15 5 8 10l7 5V5ZM5 5v10" />,
  stepForward: <path d="M5 5l7 5-7 5V5Zm10 0v10" />,
  loop: <path d="M4 9V8a3 3 0 0 1 3-3h8m0 0-2.5-2.5M15 5l-2.5 2.5M16 11v1a3 3 0 0 1-3 3H5m0 0 2.5 2.5M5 15l2.5-2.5" />,
  options: <path d="M4 6h7m4 0h1M4 14h1m4 0h7M13 4v4M7 12v4" />,
  solo: <path d="M4 12v-1a6 6 0 0 1 12 0v1M4 12h2.5v4H5a1 1 0 0 1-1-1v-3Zm12 0h-2.5v4H15a1 1 0 0 0 1-1v-3Z" />,
  book: <path d="M10 5.5C8.5 4.5 6.5 4 4 4v11c2.5 0 4.5.5 6 1.5m0-11c1.5-1 3.5-1.5 6-1.5v11c-2.5 0-4.5.5-6 1.5m0-11v11" />,
  close: <path d="m5.5 5.5 9 9m0-9-9 9" />,
  search: <path d="M9 15a6 6 0 1 0 0-12 6 6 0 0 0 0 12Zm4.5-1.5L17 17" />,
  arrowRight: <path d="M4 10h12m0 0-4.5-4.5M16 10l-4.5 4.5" />,
} as const;

export type IconName = keyof typeof PATHS;

export function Icon({ name, size = 20 }: { name: IconName; size?: number }) {
  return (
    <svg className="icon" width={size} height={size} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      {PATHS[name]}
    </svg>
  );
}
