/** The mark: a fermata over four short voice-coloured lines. */
export function Mark({ size = 28 }: { size?: number }) {
  return (
    <svg className="mark" width={size} height={size} viewBox="0 0 32 32" aria-hidden="true" focusable="false">
      <path d="M7 15a9 9 0 0 1 18 0" fill="none" stroke="var(--ink)" strokeWidth="2.4" strokeLinecap="round" />
      <circle cx="16" cy="12.2" r="2.1" fill="var(--ink)" />
      <g strokeWidth="2.4" strokeLinecap="round">
        <path d="M8 19.5h16" stroke="var(--v-s)" />
        <path d="M8 23h16" stroke="var(--v-a)" />
        <path d="M8 26.5h16" stroke="var(--v-t)" />
        <path d="M8 30h16" stroke="var(--v-b)" />
      </g>
    </svg>
  );
}
