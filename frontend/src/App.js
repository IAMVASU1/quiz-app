import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { AuthProvider } from "./contexts/AuthContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import useAppTheme from "./hooks/useAppTheme";
import RootNavigator from "./navigation";

function AppNavigation() {
  const { navigationTheme, ready } = useAppTheme();
  if (!ready) return null;
  return (
    <NavigationContainer theme={navigationTheme}>
      <RootNavigator />
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppNavigation />
      </AuthProvider>
    </ThemeProvider>
  );
}
