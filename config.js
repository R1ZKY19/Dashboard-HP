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
  API_URL: "https://script.google.com/macros/s/AKfycbyNREOBPwm7Lg4FcoYjiQH4Y7KXMKqWP433Ut1hAmPg04Y7p1tQsKceeAbdrmYU6SJotQ/exec",
  SESSION_KEY: "member_monitor_session_v2",
  CACHE_KEY: "member_monitor_cache_v2",
  HEARTBEAT_INTERVAL: 15000, // 15 detik
  DEFAULT_PAGE_SIZE: 10,
  AUTO_FALLBACK_OFFLINE: true // Jika API tidak merespons, fallback ke local storage/mock state
};
