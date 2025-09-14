import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
  Platform,
  KeyboardAvoidingView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as Location from "expo-location";
import { installProduct } from "../src/services/api";
import Colors from "../constants/Colors";

export default function InstallFormScreen() {
  const router = useRouter();
  const { productId, employeeId } = useLocalSearchParams();

  const [trackLocation, setTrackLocation] = useState("");
  const [notes, setNotes] = useState("");
  const [gpsLocation, setGpsLocation] = useState(null);
  const [locationError, setLocationError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setLocationError("Permission to access location was denied");
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      const coords = {
        lat: location.coords.latitude,
        lng: location.coords.longitude,
      };
      setGpsLocation(coords);

      try {
        let addressResponse = await Location.reverseGeocodeAsync({
          latitude: coords.lat,
          longitude: coords.lng,
        });

        if (addressResponse && addressResponse.length > 0) {
          const address = addressResponse[0];

          const addressParts = new Set();

          if (address.name) addressParts.add(address.name);
          if (address.street) addressParts.add(address.street);
          if (address.district) addressParts.add(address.district);
          if (address.city) addressParts.add(address.city);
          if (address.region) addressParts.add(address.region);
          if (address.postalCode) addressParts.add(address.postalCode);
          if (address.country) addressParts.add(address.country);

          const formattedAddress = [...addressParts].join(", ");
          setTrackLocation(formattedAddress);
        }
      } catch (e) {
        console.error("Reverse geocoding failed", e);
      }
    })();
  }, []);

  const handleSubmit = async () => {
    if (!trackLocation.trim()) {
      Alert.alert("Validation Error", "Please enter a track location.");
      return;
    }
    if (!gpsLocation) {
      Alert.alert("GPS Error", "Could not determine GPS location.");
      return;
    }

    setIsLoading(true);
    const installData = {
      productId,
      trackLocation,
      gpsLocation,
      installedBy: employeeId,
      installDate: new Date().toISOString(),
      notes,
    };

    try {
      await installProduct(installData);
      Alert.alert(
        "Success",
        `Product ${productId} has been marked as installed.`,
        [{ text: "OK", onPress: () => router.back() }]
      );
    } catch (error) {
      Alert.alert(
        "Installation Failed",
        error.response?.data?.message ||
          "Something went wrong. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.title}>Install Product</Text>

          <View style={styles.infoBox}>
            <Text style={styles.label}>Product ID (from QR Scan)</Text>
            <Text style={styles.value}>{productId}</Text>
          </View>

          <Text style={styles.label}>Track Location (Editable)</Text>
          <TextInput
            style={styles.input}
            placeholder="Fetching address from GPS..."
            value={trackLocation}
            onChangeText={setTrackLocation}
          />

          <Text style={styles.label}>GPS Location</Text>
          <View style={[styles.input, styles.gpsBox]}>
            {gpsLocation ? (
              <Text style={styles.gpsText}>
                Lat: {gpsLocation.lat.toFixed(4)}, Lng:{" "}
                {gpsLocation.lng.toFixed(4)}
              </Text>
            ) : (
              <Text style={styles.gpsText}>
                {locationError || "Fetching GPS..."}
              </Text>
            )}
          </View>

          <Text style={styles.label}>Notes</Text>
          <TextInput
            style={[styles.input, styles.multilineInput]}
            placeholder="Add any installation notes..."
            value={notes}
            onChangeText={setNotes}
            multiline
          />

          <TouchableOpacity
            style={styles.button}
            onPress={handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.buttonText}>Complete Installation</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },
  content: { padding: 20 },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: Colors.light.text,
    marginBottom: 20,
  },
  infoBox: {
    marginBottom: 15,
    backgroundColor: Colors.light.card,
    padding: 15,
    borderRadius: 10,
  },
  label: { fontSize: 16, color: Colors.light.secondaryText, marginBottom: 5 },
  value: { fontSize: 18, fontWeight: "600", color: Colors.light.text },
  input: {
    width: "100%",
    minHeight: 50,
    backgroundColor: Colors.light.card,
    borderRadius: 10,
    paddingHorizontal: 15,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#ddd",
    marginBottom: 20,
    justifyContent: "center",
  },
  gpsBox: { backgroundColor: "#e9e9e9" },
  gpsText: { fontSize: 16, color: Colors.light.secondaryText },
  multilineInput: { height: 100, textAlignVertical: "top", paddingTop: 15 },
  button: {
    width: "100%",
    height: 50,
    backgroundColor: Colors.light.tint,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonText: { color: "#FFFFFF", fontSize: 18, fontWeight: "bold" },
});
