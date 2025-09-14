import { Stack } from 'expo-router';
import React from 'react';

export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="dashboard" options={{ headerShown: false }} />
      <Stack.Screen name="scanner" options={{ headerShown: false }} />
      <Stack.Screen name="receiveForm" options={{ title: 'Receive Lot' }} />
      <Stack.Screen name="installForm" options={{ title: 'Install Product' }} />
      <Stack.Screen name="inspectionForm" options={{ title: 'Product Inspection' }} />

      <Stack.Screen name="manufacturerAuth" options={{ title: 'Manufacturer Portal' }} />
      <Stack.Screen name="createLot" options={{ title: 'Create New Lot' }} />
      <Stack.Screen name="lotSuccess" options={{ title: 'Lot Creation Success' }} />
      <Stack.Screen name="employeeLogin" options={{ headerShown: false }} />
      <Stack.Screen name="lotHistory" />

    </Stack>
  );
}
