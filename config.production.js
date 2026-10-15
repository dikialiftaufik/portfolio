// Production backend config — COMMITTED ON PURPOSE.
// The Supabase anon key is public by design: it ships in the browser on
// every page load, and the real access control is row-level security
// (public read, authenticated write; see supabase/schema.sql).
// NEVER put service_role or any secret in this file.
//
// Precedence: a local config.local.js (git-ignored) wins when present,
// so local development can point at a different project if needed.
window.__PORTFOLIO_CONFIG__ = window.__PORTFOLIO_CONFIG__ || {
  url: "https://akxlmnmdfwzdmssaigqk.supabase.co",
  anonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFreGxtbm1kZnd6ZG1zc2FpZ3FrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIwNzAyMDgsImV4cCI6MjEwNzY0NjIwOH0.HHRDzU963ms_pqhEGFuhpMcKL_yp1Nu_RMN4nrcPGQc"
};
