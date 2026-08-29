import { useEffect } from "react";
import { StatusBar } from "react-native";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";

import { ThemeProvider } from "@/components/themeProvider";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { LanguageProvider } from "@/contexts/LanguageContext";

// 1. Empeche le Splash Screen de se masquer automatiquement au démarrage
SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
  const { isAuthenticated, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    // 2. Tant que les données de session chargent, on ne fait rien
    if (isLoading) return;

    const inAuthGroup = segments[0] === "(protected)";

    // 3. Gestion de la redirection automatique
    if (!isAuthenticated && inAuthGroup) {
      router.replace("/");
    } else if (isAuthenticated && !inAuthGroup) {
      router.replace("/(protected)/dashboard");
    }

    // 4. Masque le Splash Screen une fois que tout est prêt et redirigé
    SplashScreen.hideAsync();
  }, [isAuthenticated, isLoading, router, segments]);

  return (
    <>
      <Stack screenOptions={{ headerShown: false }} />
      <StatusBar />
    </>
  );
}

export default function RootLayout() {
  return (
    <LanguageProvider>
      <ThemeProvider>
        <AuthProvider>
          <RootLayoutNav />
        </AuthProvider>
      </ThemeProvider>
    </LanguageProvider>
  );
}