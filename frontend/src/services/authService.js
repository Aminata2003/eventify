import { api, setTokens, clearTokens } from "./api";

const AUTH_BASE = ""; // api already uses baseURL

export async function login(usernameOrEmail, password) {
  const identifier = usernameOrEmail.trim();
  const tryPayloads = [
    { username: identifier.toLowerCase(), password },
    { username: identifier, password },
    { email: identifier.toLowerCase(), password },
    { email: identifier, password },
  ];

  let lastErr = null;
  for (const payload of tryPayloads) {
    try {
      const res = await api.post("/auth/login/", payload);
      const access = res.data.access || res.data.token || res.data.access_token;
      const refresh = res.data.refresh || res.data.refresh_token;
      if (access) setTokens(access, refresh);
      const user = await getCurrentUser();
      return user;
    } catch (e) {
      lastErr = e;
      // if it's not a 401, stop retrying
      if (!e.response || e.response.status !== 401) break;
    }
  }
  // rethrow the last error for the caller to handle
  throw lastErr;
}

export async function register(name, email, password, role = "participant") {
  const payload = { name, email: email.trim().toLowerCase(), password, role };
  const res = await api.post("/auth/register/", payload);
  return res.data.user;
}

export function logout() {
	clearTokens();
}

export function getCurrentUser() {
	return api.get("/users/me/").then((r) => r.data).catch(() => null);
}

export default { login, logout, register, getCurrentUser };

