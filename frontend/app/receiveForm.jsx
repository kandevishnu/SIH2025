
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ActivityIndicator, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { receiveLot } from '../src/services/api';
import Colors from '../constants/Colors';

const extractLotId = (scannedData) => {
    if (!scannedData) return null;

    try {
        const jsonData = JSON.parse(scannedData);
        if (jsonData && jsonData.lotId) {
            return jsonData.lotId;
        }
    } catch (e) {
    }


    const match = scannedData.match(/lotId=([^&]+)/);
    if (match && match[1]) {
        return match[1];
    }

    return null;
};


export default function ReceiveFormScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { employeeId } = params;

  const scannedData = params.lotId; 
  const lotId = extractLotId(scannedData);

  const [depotId, setDepotId] = useState('');
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!lotId) {
        Alert.alert(
            "Invalid QR Code", 
            "The scanned QR code does not contain a valid Lot ID. Please scan a package QR code.",
            [{ text: 'OK', onPress: () => router.back() }]
        );
    }
  }, [lotId]);


  const handleSubmit = async () => {
    if (!depotId.trim()) {
      Alert.alert('Validation Error', 'Please enter a Depot ID.');
      return;
    }

    setIsLoading(true);
    const receiveData = {
      lotId,
      depotId,
      inspector: employeeId,
      notes,
    };

    try {
      const response = await receiveLot(receiveData);
      console.log('API Response:', response.data);
      Alert.alert(
        'Success',
        `Lot ${lotId} has been successfully received at ${depotId}.`,
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (error) {

        const errorMessage = error.response?.data?.message || '';
        if (error.response?.status === 409 || errorMessage.includes('already been received')) {
            Alert.alert(
                'Lot Already Received',
                'This lot package has already been scanned and recorded in the system.',
                [{ text: 'OK', onPress: () => router.back() }]
            );
        } else {

            console.log("--- RECEIVE LOT ERROR ---");
            console.log("Raw Error Response:", error.response?.data);
            const errorDetails = JSON.stringify(error.response?.data || error.message, null, 2);
            Alert.alert('API Error Details', errorDetails);
        }
    } finally {
      setIsLoading(false);
    }
  };

  if (!lotId) {
    return <SafeAreaView style={styles.container}><ActivityIndicator /></SafeAreaView>;
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.title}>Confirm Lot Receipt</Text>

          <View style={styles.infoBox}>
            <Text style={styles.label}>Lot ID (from QR Scan)</Text>
            <Text style={styles.value}>{lotId}</Text>
          </View>

          <View style={styles.infoBox}>
            <Text style={styles.label}>Inspector</Text>
            <Text style={styles.value}>{employeeId}</Text>
          </View>
          
          <Text style={styles.label}>Depot ID</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter Depot ID (e.g., DEPOT_001)"
            value={depotId}
            onChangeText={setDepotId}
            autoCapitalize="characters"
          />

          <Text style={styles.label}>Notes</Text>
          <TextInput
            style={[styles.input, styles.multilineInput]}
            placeholder="Add any relevant notes..."
            value={notes}
            onChangeText={setNotes}
            multiline
          />
          
          <TouchableOpacity style={styles.button} onPress={handleSubmit} disabled={isLoading}>
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.buttonText}>Confirm Receipt</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.light.text,
    marginBottom: 20,
  },
  infoBox: {
    marginBottom: 15,
    backgroundColor: Colors.light.card,
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#eee'
  },
  label: {
    fontSize: 16,
    color: Colors.light.secondaryText,
    marginBottom: 5,
  },
  value: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.text,
  },
  input: {
    width: '100%',
    height: 50,
    backgroundColor: Colors.light.card,
    borderRadius: 10,
    paddingHorizontal: 15,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    marginBottom: 20,
  },
  multilineInput: {
    height: 100,
    textAlignVertical: 'top',
    paddingTop: 15,
  },
  button: {
    width: '100%',
    height: 50,
    backgroundColor: Colors.light.tint,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
});