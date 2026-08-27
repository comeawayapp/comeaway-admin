// Single source of truth for which roles may see which admin sections.
// Roles come from the API: owner | admin | content_manager (null = customer).
//
// Endpoint permissions this mirrors:
//   GET  /auth/all-user            -> Owner or Admin
//   /entitlements/admin/*          -> Admin (and Owner)
//   /activation-codes/admin/*      -> Admin (and Owner)
//   GET  /team, DELETE /team/{id}  -> Owner only
//   POST /team/invite              -> Owner or Admin

const ALL_STAFF = ["owner", "admin", "content_manager"];
const OWNER_AND_ADMIN = ["owner", "admin"];

// `group` drives the sidebar section headings; `hidden` keeps a section
// reachable in code but out of the nav (these were commented out previously).
export const MENU_ITEMS = {
  // GET /admin/dashboard is Owner/Admin only, so Content Managers never see
  // this section - they land on Sound Management instead.
  Dashboard: { label: "Dashboard", roles: OWNER_AND_ADMIN, group: "Overview" },
  Categories: { label: "Categories", roles: ALL_STAFF, group: "Content" },
  SoundManagement: {
    label: "Sound Management",
    roles: ALL_STAFF,
    group: "Content",
  },
  UserManagement: {
    label: "User Management",
    roles: OWNER_AND_ADMIN,
    group: "Customers",
  },
  EntitlementManagement: {
    label: "Entitlements",
    roles: OWNER_AND_ADMIN,
    group: "Customers",
  },
  DiscountManagement: {
    label: "Discount Management",
    roles: OWNER_AND_ADMIN,
    group: "Commerce",
    hidden: true,
  },
  PriceManagement: {
    label: "Price Management",
    roles: OWNER_AND_ADMIN,
    group: "Commerce",
    hidden: true,
  },
  ActivationCodes: {
    label: "Activation Codes",
    roles: OWNER_AND_ADMIN,
    group: "Customers",
    hidden: true,
  },
  // Admins land on an invite-only view; the roster itself is Owner-only.
  TeamManagement: {
    label: "Team Management",
    roles: OWNER_AND_ADMIN,
    group: "Administration",
  },
  Settings: { label: "Settings", roles: ALL_STAFF, group: "Administration" },
};

// Sections the given role can see in the sidebar, grouped in declaration
// order: [{ group, items: [{ name, label }] }]
export const getNavGroups = (role) => {
  const groups = [];
  Object.entries(MENU_ITEMS).forEach(([name, item]) => {
    if (item.hidden || !item.roles.includes(role)) return;
    let group = groups.find((g) => g.group === item.group);
    if (!group) {
      group = { group: item.group, items: [] };
      groups.push(group);
    }
    group.items.push({ name, label: item.label });
  });
  return groups;
};

export const isMenuItemAllowed = (name, role) => {
  const item = MENU_ITEMS[name];
  if (!item) return false;
  return item.roles.includes(role);
};

// Where each role lands after logging in.
const DEFAULT_SECTION_BY_ROLE = {
  owner: "Dashboard",
  admin: "Dashboard",
  content_manager: "SoundManagement",
};

export const getDefaultSection = (role) => {
  const preferred = DEFAULT_SECTION_BY_ROLE[role];
  if (preferred && isMenuItemAllowed(preferred, role)) return preferred;
  // Fall back to the first section this role is allowed to open.
  return (
    Object.keys(MENU_ITEMS).find((name) => isMenuItemAllowed(name, role)) ||
    "Settings"
  );
};

const SECTION_KEY = "comeaway:section";

// Reopen whatever section the user was last on, as long as their role still
// allows it - a refresh should not throw them back to the default.
export const loadSection = (role) => {
  try {
    const stored = localStorage.getItem(SECTION_KEY);
    if (stored && isMenuItemAllowed(stored, role)) return stored;
  } catch {
    // localStorage can throw in private/blocked contexts; fall through.
  }
  return getDefaultSection(role);
};

export const saveSection = (name) => {
  try {
    localStorage.setItem(SECTION_KEY, name);
  } catch {
    // Persistence is a convenience, never a requirement.
  }
};
