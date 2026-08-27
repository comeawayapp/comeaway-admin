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

export const MENU_ITEMS = {
  // GET /admin/dashboard is Owner/Admin only, so Content Managers never see
  // this section - they land on Sound Management instead.
  Dashboard: { label: "Dashboard", roles: OWNER_AND_ADMIN },
  Categories: { label: "Categories", roles: ALL_STAFF },
  SoundManagement: { label: "Sound Management", roles: ALL_STAFF },
  UserManagement: { label: "User Management", roles: OWNER_AND_ADMIN },
  DiscountManagement: { label: "Discount Management", roles: OWNER_AND_ADMIN },
  PriceManagement: { label: "Price Management", roles: OWNER_AND_ADMIN },
  ActivationCodes: { label: "Activation Codes", roles: OWNER_AND_ADMIN },
  EntitlementManagement: {
    label: "Entitlement Management",
    roles: OWNER_AND_ADMIN,
  },
  // Admins land on an invite-only view; the roster itself is Owner-only.
  TeamManagement: { label: "Team Management", roles: OWNER_AND_ADMIN },
  Settings: { label: "Settings", roles: ALL_STAFF },
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
