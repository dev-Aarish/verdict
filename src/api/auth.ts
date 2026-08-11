import { apiFetch } from "./client";

export function getCurrentUserFn() {
  return apiFetch<any>("/auth/me");
}

export function signupFn({ data }: { data: { username: string; email: string; password: string; bio?: string } }) {
  return apiFetch<any>("/auth/signup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export function loginFn({ data }: { data: { email: string; password: string } }) {
  return apiFetch<any>("/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export function googleAuthFn({ data }: { data: { credential: string } }) {
  return apiFetch<any>("/auth/google", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export function logoutFn() {
  return apiFetch<any>("/auth/logout", {
    method: "POST",
  });
}
