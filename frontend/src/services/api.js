import axios from "axios";

const configuredBaseUrl = import.meta.env.VITE_API_URL?.replace(/\/$/, "");
const isProduction = import.meta.env.PROD;

// En production, une URL explicite évite d'envoyer les requêtes vers l'ordinateur
// de la personne qui consulte le site (127.0.0.1).
const BASE_URL = configuredBaseUrl || (isProduction ? "" : "http://127.0.0.1:8000/api");
const API_CONFIGURATION_ERROR = isProduction && !configuredBaseUrl
  ? "Configuration manquante : VITE_API_URL doit pointer vers l'API Eventify."
  : null;

const api = axios.create({
	baseURL: BASE_URL,
	timeout: 10000,
});

// Token helpers use localStorage by default
const getAccessToken = () => localStorage.getItem("access_token");
const getRefreshToken = () => localStorage.getItem("refresh_token");
const setTokens = (access, refresh) => {
	if (access) localStorage.setItem("access_token", access);
	if (refresh) localStorage.setItem("refresh_token", refresh);
};
const clearTokens = () => {
	localStorage.removeItem("access_token");
	localStorage.removeItem("refresh_token");
};

// Attach access token
api.interceptors.request.use((config) => {
	if (API_CONFIGURATION_ERROR) {
		return Promise.reject(Object.assign(new Error(API_CONFIGURATION_ERROR), {
			code: "API_NOT_CONFIGURED",
		}));
	}
	const token = getAccessToken();
	// Skip invalid token values that may have been stored by accident
	if (token && token !== "null" && token !== "undefined") {
		config.headers.Authorization = `Bearer ${token}`;
	}
	return config;
});

// Refresh logic
let isRefreshing = false;
let refreshQueue = [];

function processQueue(error, token = null) {
	refreshQueue.forEach((p) => (error ? p.reject(error) : p.resolve(token)));
	refreshQueue = [];
}

api.interceptors.response.use(
	(res) => res,
	async (err) => {
		const originalRequest = err.config;
		if (!originalRequest) return Promise.reject(err);

		if (err.response && err.response.status === 401 && !originalRequest._retry) {
			originalRequest._retry = true;
			if (isRefreshing) {
				return new Promise(function (resolve, reject) {
					refreshQueue.push({ resolve, reject });
				})
					.then((token) => {
						originalRequest.headers.Authorization = `Bearer ${token}`;
						return api(originalRequest);
					})
					.catch((e) => Promise.reject(e));
			}

			isRefreshing = true;
			const refresh = getRefreshToken();
			if (!refresh) {
				clearTokens();
				isRefreshing = false;
				// If this was a safe GET request, retry without auth header (public endpoint)
				if ((originalRequest.method || "get").toLowerCase() === "get") {
					const cloned = { ...originalRequest };
					delete cloned.headers.Authorization;
					return api(cloned);
				}
				return Promise.reject(err);
			}

			try {
				const resp = await axios.post(`${BASE_URL}/auth/token/refresh/`, { refresh });
				const newAccess = resp.data.access || resp.data.token || null;
				if (newAccess) setTokens(newAccess, refresh);
				processQueue(null, newAccess);
				originalRequest.headers.Authorization = `Bearer ${newAccess}`;
				return api(originalRequest);
			} catch (e) {
				processQueue(e, null);
				clearTokens();
				// If refresh fails, try once without auth for safe GET requests
				if ((originalRequest.method || "get").toLowerCase() === "get") {
					const cloned = { ...originalRequest };
					delete cloned.headers.Authorization;
					return api(cloned);
				}
				return Promise.reject(e);
			} finally {
				isRefreshing = false;
			}
		}
		return Promise.reject(err);
	}
);

export { api, setTokens, clearTokens, getAccessToken, getRefreshToken, BASE_URL };
