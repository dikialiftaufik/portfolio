// --- Config Module ---
// Interface: getConfig() -> { url, anonKey } | null.
// Reads credentials the operator pasted into config.local.js
// (window.__PORTFOLIO_CONFIG__). null = seed mode with honest banner,
// never a crash. The real key is NEVER committed (see .gitignore).
function getConfig() {
    const cfg = window.__PORTFOLIO_CONFIG__;
    if (!cfg || !cfg.url || !cfg.anonKey) return null;
    if (String(cfg.anonKey).indexOf('REPLACE-ME') !== -1) return null;
    return { url: cfg.url, anonKey: cfg.anonKey };
}
