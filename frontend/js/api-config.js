/**
 * Resolves API base URL for FarmTech.
 * - Production (e.g. Render): same origin as the page — https://farmtech-k023.onrender.com
 * - Local Express on :5001: same origin
 * - Local live-server on another port: API on http://localhost:5001
 * Override: set window.FARMTECH_API_BASE_URL before this script loads.
 */
(function (w) {
    function resolveApiBase() {
        if (w.FARMTECH_API_BASE_URL != null && String(w.FARMTECH_API_BASE_URL).trim() !== "") {
            return String(w.FARMTECH_API_BASE_URL).replace(/\/$/, "");
        }
        const h = w.location.hostname;
        const p = w.location.port;
        const local = h === "localhost" || h === "127.0.0.1";
        if (local && p && p !== "5001") {
            return "http://localhost:5001";
        }
        return w.location.origin;
    }
    w.API_BASE_URL = resolveApiBase();
})(typeof window !== "undefined" ? window : globalThis);
