import React, { useEffect } from "react";
import { LogBox } from "react-native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SafeAreaProvider } from "react-native-safe-area-context";
import * as SplashScreen from "expo-splash-screen";
import { AuthProvider } from "../context/AuthContext";
import { Colors } from "../constants/theme";

LogBox.ignoreLogs(["[Worklets]"]);

// Automatically hide splash screen immediately when JS bundle mounts
SplashScreen.hideAsync().catch(() => {});

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
  useEffect(() => {
    SplashScreen.hideAsync().catch(() => {});
  }, []);

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
          title: "THE PRINT",
          presentation: "card",
        }}
      />
      <Stack.Screen
        name="user/[username]"
        options={{
          title: "TASTE DOSSIER",
          presentation: "card",
        }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <StatusBar style="light" />
          <RootNavigator />
        </AuthProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}

