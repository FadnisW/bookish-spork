// Utility functions should not contain top-level server configurations like `await auth()`.
// All role and auth extraction has been relocated natively to their respective Server Components.

export const formatTimeString = (date: Date) => {
  return date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
};