// app/_layout.tsx
import React from 'react';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/useColorScheme';
import { AuthProvider } from '@/hooks/useAuth';            
import { MealsProvider } from './context/MealsContext';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  if (!loaded) {
    return null;
  }

  const theme = colorScheme === 'light' ? DarkTheme : DefaultTheme;

  return (
    <AuthProvider>                                   
      <ThemeProvider value={theme}>
        <MealsProvider>
          <Stack>
            {/* main tab navigator */}
            <Stack.Screen 
              name="(tabs)" 
              options={{ headerShown: false }} 
            />

            {/* Meal detail screen rendered above the tabs */}
            <Stack.Screen
              name="meal/[id]"
              options={{
                headerShown: true,
                title: 'Meal Details',
              }}
            />

            {/* Fallback */}
            <Stack.Screen 
              name="+not-found" 
              options={{ title: 'Not Found' }} 
            />
          </Stack>
        </MealsProvider>
        <StatusBar style="auto" />
      </ThemeProvider>
    </AuthProvider>
  );
}
