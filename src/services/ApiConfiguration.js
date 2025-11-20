export const API_BASE_URL = "https://m.airzonecloud.com/api/v1";
export const LOGIN_URL = `${API_BASE_URL}/auth/login`;
export const NOTIFICATIONS_URL = `${API_BASE_URL}/notifications`;
export const INSTALLATIONS_URL = `${API_BASE_URL}/installations`;
export const WEBSOCKET_URL = `wss://m.airzonecloud.com/api/v1/websockets/conn/`;
export const WEBSOCKET_DELAY_BEFORE_RECONNECTION_MS = 60000 * 3; // 3 minutes
