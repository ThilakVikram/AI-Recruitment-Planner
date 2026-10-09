/** Main application routes shown in the sidebar (safe for client and server). */
export type NavItem = {
  href: string;
  label: string;
  description: string;
  /** Carries the active ?role= across navigation. */
  roleScoped: boolean;
  icon: React.ReactNode;
};

const iconProps = {
  width: 18,
  height: 18,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
} as const;

export const NAV: NavItem[] = [
  {
    href: "/",
    label: "Home",
    description: "Overview of your account, roles and features",
    roleScoped: false,
    icon: (
      <svg {...iconProps}>
        <path d="M3 10.5 12 3l9 7.5" />
        <path d="M5 9.5V21h14V9.5" />
        <path d="M9.5 21v-6h5v6" />
      </svg>
    ),
  },
  {
    href: "/workflow",
    label: "Workflow",
    description: "Seven AI-assisted stages from kick-off to final decision",
    roleScoped: true,
    icon: (
      <svg {...iconProps}>
        <circle cx="5" cy="6" r="2" />
        <circle cx="19" cy="6" r="2" />
        <circle cx="12" cy="18" r="2" />
        <path d="M7 6h10M6 8l5 8.5M18 8l-5 8.5" />
      </svg>
    ),
  },
  {
    href: "/tracker",
    label: "Candidate Tracker",
    description: "Scored candidates, decisions and recruiter notes",
    roleScoped: true,
    icon: (
      <svg {...iconProps}>
        <rect x="3" y="4" width="18" height="16" rx="2" />
        <path d="M3 9h18M8 13h8M8 16.5h5" />
      </svg>
    ),
  },
];

export function isNavActive(href: string, pathname: string): boolean {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}
