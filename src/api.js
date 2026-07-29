const DEFAULT_API_BASE_URL = "http://localhost:5000/api";

export const API_BASE_URL = (
    import.meta.env.VITE_API_URL || DEFAULT_API_BASE_URL
).replace(/\/+$/, "");

export function buildApiUrl(path = "") {
    const normalizedPath = path.startsWith("/") ? path : `/${path}`;
    return `${API_BASE_URL}${normalizedPath}`;
}

export function getAuthToken() {
    return localStorage.getItem("nexo_token");
}

export function clearAuthSession() {
    localStorage.removeItem("nexo_token");
    localStorage.removeItem("nexo_user");
}

function decodeJwtPayload(token) {
    try {
        const payload = token.split(".")[1];

        if (!payload) {
            return null;
        }

        const normalizedPayload = payload
            .replace(/-/g, "+")
            .replace(/_/g, "/");

        const paddedPayload = normalizedPayload.padEnd(
            Math.ceil(normalizedPayload.length / 4) * 4,
            "="
        );

        return JSON.parse(atob(paddedPayload));
    } catch {
        return null;
    }
}

export function isAuthTokenExpired(token = getAuthToken()) {
    if (!token) {
        return true;
    }

    const payload = decodeJwtPayload(token);

    if (!payload || typeof payload.exp !== "number") {
        return true;
    }

    return payload.exp * 1000 <= Date.now();
}

function redirectToLogin() {
    if (window.location.pathname !== "/login") {
        window.location.assign("/login");
    }
}

async function parseResponseBody(response) {
    const responseText = await response.text();

    if (!responseText) {
        return null;
    }

    try {
        return JSON.parse(responseText);
    } catch {
        return {
            message: responseText,
        };
    }
}

export async function apiRequest(path, options = {}) {
    const {
        skipAuthRedirect = false,
        headers: customHeaders = {},
        ...fetchOptions
    } = options;

    const token = getAuthToken();

    if (
        token &&
        isAuthTokenExpired(token) &&
        !skipAuthRedirect
    ) {
        clearAuthSession();
        redirectToLogin();

        throw new Error("Your session has expired. Please sign in again.");
    }

    const headers = new Headers(customHeaders);

    if (token && !isAuthTokenExpired(token)) {
        headers.set("Authorization", `Bearer ${token}`);
    }

    if (
        fetchOptions.body &&
        !(fetchOptions.body instanceof FormData) &&
        !headers.has("Content-Type")
    ) {
        headers.set("Content-Type", "application/json");
    }

    let response;

    try {
        response = await fetch(buildApiUrl(path), {
            ...fetchOptions,
            headers,
        });
    } catch {
        throw new Error(
            "Cannot connect to the server. Please check that the backend is running."
        );
    }

    const data = await parseResponseBody(response);

    if (response.status === 401 && !skipAuthRedirect) {
        clearAuthSession();
        redirectToLogin();

        throw new Error("Your session has expired. Please sign in again.");
    }

    if (!response.ok) {
        const error = new Error(
            data?.error ||
            data?.message ||
            `Request failed with status ${response.status}.`
        );

        error.status = response.status;
        error.data = data;

        throw error;
    }

    return data;
}