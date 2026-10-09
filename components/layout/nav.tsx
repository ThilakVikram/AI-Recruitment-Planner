/** Main application routes shown in the sidebar (safe for client and server). */
export type NavItem = {
  href: string;
  label: string;
  description: string;
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
    icon: (
      <svg {...iconProps}>
        <path d="M3 10.5 12 3l9 7.5" />
        <path d="M5 9.5V21h14V9.5" />
        <path d="M9.5 21v-6h5v6" />
      </svg>
    ),
  },
  {
    href: "/roles",
    label: "Roles",
    description: "Positions you're hiring for, with requirements, openings and status",
    icon: (
      <svg {...iconProps}>
        <rect x="3" y="7" width="18" height="13" rx="2" />
        <path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M3 12.5h18" />
      </svg>
    ),
  },
  {
    href: "/recruitment",
    label: "Recruitment",
    description: "Hiring drives: kick-off notes, AI documents and CVs ranked by score",
    icon: (
      <svg {...iconProps}>
        <circle cx="11" cy="11" r="6.5" />
        <path d="m20.5 20.5-4.9-4.9M11 8.5v5M8.5 11h5" />
      </svg>
    ),
  },
  {
    href: "/applicants",
    label: "Applicants",
    description: "Talent pool with contact details, CVs and other documents",
    icon: (
      <svg {...iconProps}>
        <circle cx="9" cy="8" r="3.5" />
        <path d="M2.5 20c.6-3.6 3.3-5.5 6.5-5.5s5.9 1.9 6.5 5.5" />
        <path d="M16 4.5a3.5 3.5 0 0 1 0 7M18.5 14.8c1.7.8 2.8 2.5 3 5.2" />
      </svg>
    ),
  },
];

export function isNavActive(href: string, pathname: string): boolean {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}
