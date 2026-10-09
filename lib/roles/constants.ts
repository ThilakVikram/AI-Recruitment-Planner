/** Role (requisition) constants (safe for client and server). */

export const ROLE_STATUSES = ["Open", "On hold", "Filled", "Closed"] as const;
export type RoleStatus = (typeof ROLE_STATUSES)[number];

export const ROLE_PRIORITIES = ["Low", "Medium", "High", "Urgent"] as const;
export type RolePriority = (typeof ROLE_PRIORITIES)[number];

export const WORK_MODES = ["Onsite", "Hybrid", "Remote"] as const;
export const EMPLOYMENT_TYPES = ["Full-time", "Part-time", "Contract", "Internship"] as const;

/** Roles still being sourced. Others stay accessible but are de-emphasised in pickers. */
export function isActiveRoleStatus(status: string): boolean {
  return status === "Open" || status === "On hold";
}

/** "Senior Backend Developer (Closed)" — for role pickers across the app. */
export function roleOptionLabel(role: { name: string; status: string }): string {
  return role.status === "Open" ? role.name : `${role.name} (${role.status})`;
}
