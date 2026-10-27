import React, { useEffect } from "react";
import { LogBox } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SafeAreaProvider } from "react-native-safe-area-context";
import * as SplashScreen from "expo-splash-screen";
import { AuthProvider, useAuth } from "../context/AuthContext";
import { Colors } from "../constants/theme";

LogBox.ignoreLogs([
  "[Worklets]",
  "Cannot connect to Expo CLI",
  "Can't perform a React state update on a component that hasn't mounted yet",
]);

// Suppress known Expo Router / React 19 Fabric useLinking initial mount warning in terminal
if (__DEV__) {
  const originalConsoleError = console.error;
  console.error = (...args: any[]) => {
    const msg = typeof args[0] === "string" ? args[0] : "";
    if (
      msg.includes("Can't perform a React state update on a component that hasn't mounted yet") ||
      msg.includes("warnAboutUpdateOnNotYetMountedFiberInDEV")
    ) {
      return;
    }
    originalConsoleError(...args);
  };
}

// Prevent auto-hiding until RootNavigator has mounted
SplashScreen.preventAutoHideAsync().catch(() => {});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes
      refetchOnWindowFocus: false,
    },
  },
});

function RootNavigator() {
  const { isReady } = useAuth();

  useEffect(() => {
    if (isReady) {
      SplashScreen.hideAsync().catch(() => {});
    }

    // Safety fallback so splash screen is never stuck
    const fallbackTimer = setTimeout(() => {
      SplashScreen.hideAsync().catch(() => {});
    }, 1500);

    return () => clearTimeout(fallbackTimer);
  }, [isReady]);

  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: Colors.ink,
        },
        headerTintColor: Colors.paper,
        headerTitleStyle: {
          fontWeight: "800",
          fontSize: 16,
        },
        headerShadowVisible: false,
        contentStyle: {
          backgroundColor: Colors.ink,
        },
      }}
    >
      <Stack.Screen
        name="(tabs)"
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="(auth)/login"
        options={{
          title: "Sign In",
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="(auth)/signup"
        options={{
          title: "Create Account",
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="movie/[id]"
        options={{
          headerShown: false,
          presentation: "card",
        }}
      />
      <Stack.Screen
        name="user/[username]"
        options={{
          headerShown: false,
          presentation: "card",
        }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <StatusBar style="light" />
            <RootNavigator />
          </AuthProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
