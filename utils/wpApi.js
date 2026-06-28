import axios from 'axios';

const api = axios.create({
  baseURL: process.env.WP_API_URL,
  timeout: 10_000,
});

api.interceptors.request.use((config) => {
  config.headers.Authorization = `Bearer ${process.env.BOT_API_SECRET}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const msg = err.response?.data?.message ?? err.message;
    console.error(`[wpApi] ${err.config?.method?.toUpperCase()} ${err.config?.url} → ${msg}`);
    return Promise.reject(err);
  }
);

const GUILD_ID = () => process.env.GUILD_ID;

export const getScrims        = (params = {}) => api.get('/scrims', { params });
export const getEvents        = (params = {}) => api.get('/events', { params });
export const getTournaments   = (params = {}) => api.get('/tournaments', { params });
export const getBotConfig     = ()            => api.get('/bot-config', { params: { guild_id: GUILD_ID() } });
export const syncBotConfig    = (body)        => api.post('/bot-config/sync', { guild_id: GUILD_ID(), ...body });
export const registerServer   = (body)        => api.post('/bot-servers', body);
