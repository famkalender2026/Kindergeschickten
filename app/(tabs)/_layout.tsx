import { Tabs } from "expo-router";
import React from "react";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarStyle: { display: "none" },
        headerShown: false,
      }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="favoriten" />
      <Tabs.Screen name="schatz" />
      <Tabs.Screen name="wuerfel" />
      <Tabs.Screen name="technik" />
      <Tabs.Screen name="dashboard" />
    </Tabs>
  );
}
