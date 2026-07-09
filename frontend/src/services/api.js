import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api";

const api = axios.create({
	baseURL: BASE_URL,
	timeout: 10000,
	headers: { "Content-Type": "application/json" },
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
	const token = getAccessToken();
	if (token) config.headers.Authorization = `Bearer ${token}`;
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
				return Promise.reject(e);
			} finally {
				isRefreshing = false;
			}
		}
		return Promise.reject(err);
	}
);

export { api, setTokens, clearTokens, getAccessToken, getRefreshToken };