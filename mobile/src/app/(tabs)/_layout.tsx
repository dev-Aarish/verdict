import React, { useEffect } from "react";
import { Tabs } from "expo-router";
import { Platform, View, StyleSheet } from "react-native";
import { Compass, Search, Bookmark, User } from "lucide-react-native";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../../context/AuthContext";
import { usersApi } from "../../api";
import { Colors } from "../../constants/theme";
import { Logo } from "../../components/common/Logo";

export default function TabLayout() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  useEffect(() => {
    if (user?.username) {
      queryClient.prefetchQuery({
        queryKey: ["fullProfile", user.username],
        queryFn: () => usersApi.getFullProfile(user.username),
        staleTime: 1000 * 60 * 5,
      });
    }
  }, [user?.username, queryClient]);
  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: Colors.ink,
          borderBottomWidth: 1,
          borderBottomColor: Colors.border,
        },
        headerTintColor: Colors.paper,
        headerTitleStyle: {
          fontWeight: "900",
          fontSize: 15,
        },
        headerShadowVisible: false,
        tabBarStyle: {
          backgroundColor: Colors.inkDark,
          borderTopColor: Colors.border,
          borderTopWidth: 1,
          height: Platform.OS === "ios" ? 84 : 64,
          paddingBottom: Platform.OS === "ios" ? 28 : 10,
          paddingTop: 8,
        },
        tabBarActiveTintColor: Colors.brassLight,
        tabBarInactiveTintColor: Colors.dust,
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: "800",
          letterSpacing: 0.8,
          textTransform: "uppercase",
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "The Reel",
          headerTitle: () => (
            <View style={styles.headerLogoContainer}>
              <Logo size="md" color={Colors.brass} />
            </View>
          ),
          tabBarIcon: ({ color, size }) => <Compass size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: "The Vault",
          headerTitle: "THE VAULT · DISCOVERY",
          tabBarIcon: ({ color, size }) => <Search size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="watchlist"
        options={{
          title: "Watchlist",
          headerTitle: "SCREENING QUEUE",
          tabBarIcon: ({ color, size }) => <Bookmark size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          headerTitle: "TASTE PROFILE",
          tabBarIcon: ({ color, size }) => <User size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  headerLogoContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
});


