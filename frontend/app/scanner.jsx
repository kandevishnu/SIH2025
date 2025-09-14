
import React, { useState, useEffect } from "react";
import { Text, View, StyleSheet, Button, Alert } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useLocalSearchParams, useRouter } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import Colors from "../constants/Colors";

const extractProductId = (scannedData) => {
    if (!scannedData) return null;

    if (scannedData.includes('/')) {
        const parts = scannedData.split('/');
        const lastPart = parts.filter(part => part).pop();
        if (lastPart && lastPart.startsWith('PROD_')) {
            return lastPart;
        }
    }

    if (scannedData.startsWith('PROD_')) {
        return scannedData;
    }

    return null;
};

export default function ScannerScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  
  const router = useRouter();
  const { scanMode, employeeId } = useLocalSearchParams();

  useEffect(() => {
    if (!permission) {
        requestPermission();
    }
  }, [permission]);

  if (!permission) {
    return <View />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={{ textAlign: "center", fontSize: 18, marginBottom: 20 }}>
          We need your permission to show the camera
        </Text>
        <Button onPress={requestPermission} title="Grant Permission" />
      </View>
    );
  }

  const handleBarCodeScanned = ({ data }) => {
    setScanned(true);
    const scannedData = data;

    switch (scanMode) {
        case 'receiveLot':
            try {
                const jsonData = JSON.parse(scannedData);
                if (!jsonData.lotId) throw new Error("Missing lotId");
                router.replace({
                    pathname: '/receiveForm',
                    params: { lotId: scannedData, employeeId },
                });
            } catch (e) {
                Alert.alert("Wrong QR Code", "You must scan a Lot Package QR for this task.", [{ text: 'OK', onPress: () => setScanned(false) }]);
            }
            break;

        case 'installProduct':
        case 'viewProductDetails':
            const productId = extractProductId(scannedData);
            if (!productId) {
                Alert.alert("Wrong QR Code", "You must scan a Product QR for this task.", [{ text: 'OK', onPress: () => setScanned(false) }]);
                return;
            }

            const pathname = scanMode === 'viewProductDetails' ? '/productDetail' : '/installForm';
            router.replace({
                pathname,
                params: { productId, employeeId },
            });
            break;

        default:
            Alert.alert('Scan Error', `Unknown scan mode: ${scanMode}. Please go back and try again.`);
            router.back();
            break;
    }
  };

  const getHelperText = () => {
    if (scanMode === "receiveLot") return "Scan Lot Package QR Code";
    if (scanMode === "installProduct") return "Scan Product QR Code to Install";
    if (scanMode === "viewProductDetails") return "Scan Product QR Code for Details";
    return "Scan QR Code";
  };

  return (
    <View style={styles.container}>
      <CameraView
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        style={StyleSheet.absoluteFillObject}
        facing="back"
      />
      <View style={styles.overlay}>
        <Text style={styles.helperText}>{getHelperText()}</Text>
        <View style={styles.scannerBox}>
          <MaterialCommunityIcons
            name="scan-helper"
            size={250}
            color="rgba(255, 255, 255, 0.6)"
          />
        </View>
        {scanned && (
          <Button
            title={"Tap to Scan Again"}
            onPress={() => setScanned(false)}
            color={Colors.light.tint}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center" },
  permissionContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  helperText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "white",
    backgroundColor: "rgba(0,0,0,0.7)",
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 10,
    position: "absolute",
    top: 80,
  },
  scannerBox: {
    width: 250,
    height: 250,
    justifyContent: "center",
    alignItems: "center",
  },
});