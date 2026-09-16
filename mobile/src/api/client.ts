import axios, { AxiosError } from "axios";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import { API_BASE_URL } from "../constants/theme";
import { User } from "../types";

const TOKEN_KEY = "verdict_auth_token";
const USER_KEY = "verdict_cached_user";

let memoryToken: string | null = null;
let memoryUser: User | null = null;

export async function getAuthToken(): Promise<string | null> {
  if (memoryToken) return memoryToken;
  try {
    if (Platform.OS === "web") {
      if (typeof window !== "undefined" && window.localStorage) {
        memoryToken = window.localStorage.getItem(TOKEN_KEY);
        return memoryToken;
      }
      return null;
    }
    const token = await SecureStore.getItemAsync(TOKEN_KEY);
    memoryToken = token;
    return token;
  } catch {
    return null;
  }
}

export async function setAuthToken(token: string): Promise<void> {
  memoryToken = token;
  try {
    if (Platform.OS === "web") {
      if (typeof window !== "undefined" && window.localStorage) {
        window.localStorage.setItem(TOKEN_KEY, token);
      }
      return;
    }
    await SecureStore.setItemAsync(TOKEN_KEY, token);
  } catch (err) {
    console.warn("Failed to set auth token in secure storage:", err);
  }
}

export async function removeAuthToken(): Promise<void> {
  memoryToken = null;
  try {
    if (Platform.OS === "web") {
      if (typeof window !== "undefined" && window.localStorage) {
        window.localStorage.removeItem(TOKEN_KEY);
      }
      return;
    }
    await SecureStore.deleteItemAsync(TOKEN_KEY);
  } catch (err) {
    console.warn("Failed to remove auth token from secure storage:", err);
  }
}

export async function getCachedUser(): Promise<User | null> {
  if (memoryUser) return memoryUser;
  try {
    let raw: string | null = null;
    if (Platform.OS === "web") {
      if (typeof window !== "undefined" && window.localStorage) {
        raw = window.localStorage.getItem(USER_KEY);
      }
    } else {
      raw = await SecureStore.getItemAsync(USER_KEY);
    }
    if (raw) {
      memoryUser = JSON.parse(raw);
      return memoryUser;
    }
    return null;
  } catch {
    return null;
  }
}

export async function setCachedUser(user: User | null): Promise<void> {
  memoryUser = user;
  try {
    if (!user) {
      await removeCachedUser();
      return;
    }
    const serialized = JSON.stringify(user);
    if (Platform.OS === "web") {
      if (typeof window !== "undefined" && window.localStorage) {
        window.localStorage.setItem(USER_KEY, serialized);
      }
      return;
    }
    await SecureStore.setItemAsync(USER_KEY, serialized);
  } catch (err) {
    console.warn("Failed to set cached user in storage:", err);
  }
}

export async function removeCachedUser(): Promise<void> {
  memoryUser = null;
  try {
    if (Platform.OS === "web") {
      if (typeof window !== "undefined" && window.localStorage) {
        window.localStorage.removeItem(USER_KEY);
      }
      return;
    }
    await SecureStore.deleteItemAsync(USER_KEY);
  } catch (err) {
    console.warn("Failed to remove cached user from storage:", err);
  }
}

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000,
});

apiClient.interceptors.request.use(async (config) => {
  config.baseURL = API_BASE_URL;
  const token = await getAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    // Standardize error message
    const data = error.response?.data as { error?: string; message?: string } | undefined;
    const msg = data?.error || data?.message || error.message || "An unexpected error occurred";
    return Promise.reject(new Error(msg));
  }
);
