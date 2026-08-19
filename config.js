/**
 * KONFIGURASI DASHBOARD MONITORING MEMBER
 * -------------------------------------------------------------
 * API_URL: URL deployment Web App Google Apps Script (Exec URL)
 * DEMO_MODE: Jika true atau jika API_URL kosong/offline,
 *            sistem otomatis menggunakan Local Data Engine
 *            agar dashboard tetap bisa diuji & digunakan instan.
 */
const CONFIG = {
  APP_NAME: "MEMBER MONITOR PRO",
  APP_SUBTITLE: "Internal Monitoring & Verification System",
  API_URL: "https://script.google.com/macros/s/AKfycbyn6HRefgbyHNeLodM-13a4ieAK07hej3gG9GPFQ7z3RSy8Z7n1NyUH0nxJKdmcZNXtNQ/exec",
  SESSION_KEY: "member_monitor_session_v2",
  CACHE_KEY: "member_monitor_cache_v2",
  HEARTBEAT_INTERVAL: 15000, // 15 detik
  DEFAULT_PAGE_SIZE: 10,
  AUTO_FALLBACK_OFFLINE: true // Jika API tidak merespons, fallback ke local storage/mock state
};
