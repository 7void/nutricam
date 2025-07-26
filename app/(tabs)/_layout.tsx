// app/(tabs)/_layout.tsx
import React, { useEffect } from 'react';
import { StyleSheet, Platform } from 'react-native';
import { Tabs, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../hooks/useAuth';  // <-- up three levels

export default function TabLayout() {
  const { user, loading } = useAuth();
  const router = useRouter();

  // Redirect unauthenticated users to the Login screen
  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [user, loading]);

  // While checking auth or redirecting, render nothing
  if (loading || !user) {
    return null;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: '#8e8e93',
        tabBarStyle: [
          styles.tabBar,
          Platform.select({ android: {}, default: { height: 60 } }),
        ],
      }}
    >
      {/* Home Tab */}
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="home-outline" size={30} color={color} />
          ),
        }}
      />

      {/* Upload Tab */}
      <Tabs.Screen
        name="upload"
        options={{
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="plus-circle-outline" size={29} color={color} />
          ),
        }}
      />

      {/* Profile Tab */}
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="account-outline" size={28} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: -8,
    backgroundColor: '#fff',
    borderTopWidth: 0.5,
    borderColor: '#ddd',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
});
