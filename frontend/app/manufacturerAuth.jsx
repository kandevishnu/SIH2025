
import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { createManufacturer } from "../src/services/api";
import Colors from "../constants/Colors";

export default function ManufacturerAuthScreen() {
  const router = useRouter();
  const [mode, setMode] = useState("existing"); 
  const [existingId, setExistingId] = useState("");

  const [newMan, setNewMan] = useState({
    manufacturerId: "",
    name: "",
    contact: { email: "", phone: "" },
    publicKey: "",
  });

  const handleProceed = async () => {
    if (mode === "existing") {
      if (!existingId) {
        Alert.alert("Error", "Please enter a Manufacturer ID.");
        return;
      }
      router.push({
        pathname: "/createLot",
        params: { manufacturerId: existingId },
      });
    } else {
      if (!newMan.manufacturerId || !newMan.name || !newMan.contact.email) {
        Alert.alert("Error", "Please fill in all required fields.");
        return;
      }
      try {
        await createManufacturer(newMan);
        Alert.alert("Success", "Manufacturer created successfully!");
        router.push({
          pathname: "/createLot",
          params: { manufacturerId: newMan.manufacturerId },
        });
      } catch (error) {
        console.log("--- MANUFACTURER CREATION ERROR ---");
        console.log(JSON.stringify(error.toJSON(), null, 2));

        Alert.alert(
          "Creation Failed",
          error.response?.data?.message || error.message || "An error occurred."
        );
      }
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Manufacturer Portal</Text>

        <View style={styles.toggleContainer}>
          <TouchableOpacity
            style={[
              styles.toggleButton,
              mode === "existing" && styles.toggleButtonActive,
            ]}
            onPress={() => setMode("existing")}
          >
            <Text
              style={[
                styles.toggleText,
                mode === "existing" && styles.toggleTextActive,
              ]}
            >
              Existing
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.toggleButton,
              mode === "new" && styles.toggleButtonActive,
            ]}
            onPress={() => setMode("new")}
          >
            <Text
              style={[
                styles.toggleText,
                mode === "new" && styles.toggleTextActive,
              ]}
            >
              New
            </Text>
          </TouchableOpacity>
        </View>

        {mode === "existing" ? (
          <View style={styles.form}>
            <Text style={styles.label}>Enter your Manufacturer ID</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., MFG001"
              value={existingId}
              onChangeText={setExistingId}
              autoCapitalize="characters"
            />
          </View>
        ) : (
          <View style={styles.form}>
            <TextInput
              style={styles.input}
              placeholder="Manufacturer ID (e.g., MFG004)"
              value={newMan.manufacturerId}
              onChangeText={(t) => setNewMan({ ...newMan, manufacturerId: t })}
            />
            <TextInput
              style={styles.input}
              placeholder="Full Name (e.g., Rail Wheel Factory)"
              value={newMan.name}
              onChangeText={(t) => setNewMan({ ...newMan, name: t })}
            />
            <TextInput
              style={styles.input}
              placeholder="Contact Email"
              value={newMan.contact.email}
              onChangeText={(t) =>
                setNewMan({
                  ...newMan,
                  contact: { ...newMan.contact, email: t },
                })
              }
              keyboardType="email-address"
            />
            <TextInput
              style={styles.input}
              placeholder="Contact Phone"
              value={newMan.contact.phone}
              onChangeText={(t) =>
                setNewMan({
                  ...newMan,
                  contact: { ...newMan.contact, phone: t },
                })
              }
              keyboardType="phone-pad"
            />
            <TextInput
              style={styles.input}
              placeholder="Public Key"
              value={newMan.publicKey}
              onChangeText={(t) => setNewMan({ ...newMan, publicKey: t })}
            />
          </View>
        )}

        <TouchableOpacity style={styles.proceedButton} onPress={handleProceed}>
          <Text style={styles.proceedButtonText}>Proceed</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },
  content: { padding: 20 },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  toggleContainer: {
    flexDirection: "row",
    backgroundColor: "#eee",
    borderRadius: 10,
    marginBottom: 30,
  },
  toggleButton: {
    flex: 1,
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
  },
  toggleButtonActive: { backgroundColor: Colors.light.tint },
  toggleText: { fontWeight: "bold", color: Colors.light.text },
  toggleTextActive: { color: "#FFF" },
  form: { marginBottom: 30 },
  label: { fontSize: 16, color: Colors.light.secondaryText, marginBottom: 10 },
  input: {
    height: 50,
    backgroundColor: Colors.light.card,
    borderRadius: 10,
    paddingHorizontal: 15,
    fontSize: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  proceedButton: {
    backgroundColor: Colors.light.tint,
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
  },
  proceedButtonText: { color: "#FFF", fontSize: 18, fontWeight: "bold" },
});
