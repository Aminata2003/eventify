import { api, setTokens, clearTokens } from "./api";

const AUTH_BASE = ""; // api already uses baseURL

export async function login(usernameOrEmail, password) {
  const payload = { username: usernameOrEmail.trim().toLowerCase(), password };
  const res = await api.post("/auth/login/", payload);
  const access = res.data.access || res.data.token || res.data.access_token;
  const refresh = res.data.refresh || res.data.refresh_token;
  if (access) setTokens(access, refresh);
  const user = await getCurrentUser();
  return user;
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

