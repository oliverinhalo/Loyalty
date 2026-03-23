// App.tsx
import React, { useEffect, useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import AsyncStorage from "@react-native-async-storage/async-storage";

import HomeScreen      from "./screens/HomeScreen";
import CustomerScreen  from "./screens/CustomerScreen";
import StaffScreen     from "./screens/StaffScreen";
import CreateCardScreen from "./screens/CreateCardScreen";
import PinSetupScreen  from "./screens/PinSetupScreen";
import PinEntryScreen  from "./screens/PinEntryScreen";
import { colors }      from "./theme";

const Stack = createNativeStackNavigator();

export default function App() {
  const [pinSet,      setPinSet]      = useState<boolean | null>(null); // null = loading
  const [isStaff,     setIsStaff]     = useState(false);
  const [showPinEntry, setShowPinEntry] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem("staff_pin").then(val => setPinSet(!!val));
  }, []);

  // Still checking storage
  if (pinSet === null) return null;

  // First launch — set PIN
  if (!pinSet) {
    return <PinSetupScreen onComplete={() => setPinSet(true)} />;
  }

  // Staff PIN entry overlay
  if (showPinEntry) {
    return (
      <PinEntryScreen
        onSuccess={() => { setIsStaff(true); setShowPinEntry(false); }}
        onCancel={() => setShowPinEntry(false)}
      />
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.bg },
          animation: "slide_from_right",
        }}
      >
        <Stack.Screen name="Home">
          {() => (
            <HomeScreen
              isStaff={isStaff}
              onStaffPress={() => setShowPinEntry(true)}
              onLogout={() => setIsStaff(false)}
            />
          )}
        </Stack.Screen>
        <Stack.Screen name="Customer"   component={CustomerScreen} />
        <Stack.Screen name="Staff"      component={StaffScreen} />
        <Stack.Screen name="CreateCard" component={CreateCardScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
