// Shared runtime/env helpers used by both web and catalog.
export const inDevEnvironment = !!process && process.env.NODE_ENV === "development"
