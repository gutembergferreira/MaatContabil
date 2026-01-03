const normalizeBase = (value: string) => {
    const trimmed = value.trim().replace(/\/+$/, '');
    if (!trimmed) return '';
    if (trimmed.startsWith('/')) return trimmed;
    if (trimmed === 'http:' || trimmed === 'https:') return '';
    if (/^https?:\/\//i.test(trimmed)) return trimmed;
    return `http://${trimmed}`;
};

const normalizeApiUrl = (base: string) => {
    if (!base) return '/api';
    if (/\/api\/?$/i.test(base)) return base.replace(/\/+$/, '');
    return `${base}/api`;
};

const API_BASE_KEY = 'maat_api_base';
const envBase = (import.meta as any).env?.VITE_API_BASE_URL || '';
const storedBase = typeof window !== 'undefined' ? window.localStorage.getItem(API_BASE_KEY) : '';
let apiBaseOverride = normalizeBase(String(storedBase || envBase || ''));

export const getApiBaseUrl = (): string => apiBaseOverride;

export const setApiBaseOverride = (value: string) => {
    apiBaseOverride = normalizeBase(value);
    if (typeof window !== 'undefined') {
        if (apiBaseOverride) {
            window.localStorage.setItem(API_BASE_KEY, apiBaseOverride);
        } else {
            window.localStorage.removeItem(API_BASE_KEY);
        }
    }
};

export const getApiUrl = (): string => normalizeApiUrl(apiBaseOverride);

export const loadApiBaseFromServer = async (): Promise<string> => {
    try {
        const res = await fetch(`${getApiUrl()}/app-settings`);
        if (!res.ok) return apiBaseOverride;
        const data = await res.json();
        setApiBaseOverride(String(data.apiBaseUrl || ''));
        return apiBaseOverride;
    } catch {
        return apiBaseOverride;
    }
};

export const saveApiBaseToServer = async (value: string) => {
    const normalized = normalizeBase(value);
    await fetch(`${getApiUrl()}/app-settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiBaseUrl: normalized })
    });
    setApiBaseOverride(normalized);
};

export const clearApiBaseOnServer = async () => {
    await fetch(`${getApiUrl()}/app-settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiBaseUrl: '' })
    });
    setApiBaseOverride('');
};
