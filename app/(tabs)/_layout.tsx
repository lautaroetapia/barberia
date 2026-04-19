import { Tabs } from "expo-router";
import React from "react";

import { HapticTab } from "@/components/haptic-tab";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? "light"].tint,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: { display: "none" },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="house.fill" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: "Explore",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="paperplane.fill" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="services-list"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="booking-service"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="booking-barber"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="booking-time"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="booking-confirm"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="booking-success"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="bookings"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="bookings-history"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="barber-profile"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="featured-barbers"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="favorites"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="edit-profile"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="register-barbershop"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="register-barbershop-success"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="diagnostics"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
