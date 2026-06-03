/** Assignment resource identifiers (see docs/task.md). */
export const PROTECTED_RESOURCES = {
  USER: "user_restricted",
  ADMIN: "admin_restricted",
} as const;

export type ProtectedResourceId =
  (typeof PROTECTED_RESOURCES)[keyof typeof PROTECTED_RESOURCES];

export const RESOURCE_ROUTES = {
  userRestricted: {
    profile: "/dashboard/profile",
    blogs: "/blog",
    newBlog: "/blog/new",
  },
  adminRestricted: {
    users: "/dashboard/users",
    blogs: "/dashboard/blogs",
    logs: "/dashboard/logs",
  },
} as const;
