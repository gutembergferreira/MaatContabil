let apiBaseOverride = '';

const normalizeBase = (value: string) => {
    const trimmed = value.trim().replace(/\/+$/, '');
    if (!trimmed) return '';
    if (/^https?:\/\//i.test(trimmed)) return trimmed;
    return `http://${trimmed}`;
};

const normalizeApiUrl = (base: string) => {
    if (!base) return '/api';
    if (/\/api\/?$/i.test(base)) return base.replace(/\/+$/, '');
    return `${base}/api`;
};

export const getApiBaseUrl = (): string => apiBaseOverride;

export const getApiUrl = (): string => normalizeApiUrl(apiBaseOverride);

export const loadApiBaseFromServer = async (): Promise<string> => {
    try {
        const res = await fetch('/api/app-settings');
        if (!res.ok) return apiBaseOverride;
        const data = await res.json();
        apiBaseOverride = normalizeBase(String(data.apiBaseUrl || ''));
        return apiBaseOverride;
    } catch {
        return apiBaseOverride;
    }
};

export const saveApiBaseToServer = async (value: string) => {
    const normalized = normalizeBase(value);
    await fetch('/api/app-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiBaseUrl: normalized })
    });
    apiBaseOverride = normalized;
};

export const clearApiBaseOnServer = async () => {
    await fetch('/api/app-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiBaseUrl: '' })
    });
    apiBaseOverride = '';
};
