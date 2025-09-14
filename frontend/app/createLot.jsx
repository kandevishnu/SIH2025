import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, SafeAreaView, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { createLot } from '../src/services/api';
import Colors from '../constants/Colors';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function CreateLotScreen() {
    const router = useRouter();
    const { manufacturerId } = useLocalSearchParams();
    
    const [lotDetails, setLotDetails] = useState({
        manufacturerId: manufacturerId,
        productType: '',
        quantity: '',
        warrantyMonths: ''
    });

    const handleCreateLot = async () => {
        if (!lotDetails.productType || !lotDetails.quantity || !lotDetails.warrantyMonths) {
            Alert.alert('Error', 'Please fill in all fields.');
            return;
        }
        try {
            const response = await createLot({
                ...lotDetails,
                quantity: parseInt(lotDetails.quantity, 10),
                warrantyMonths: parseInt(lotDetails.warrantyMonths, 10)
            });
            router.push({ pathname: '/lotSuccess', params: { responseData: JSON.stringify(response.data) }});
        } catch (error) {
            console.log("--- LOT CREATION ERROR ---");
            console.log(JSON.stringify(error.toJSON(), null, 2));
            Alert.alert('Creation Failed', error.response?.data?.message || 'An error occurred.');
        }
    };


    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                {/* --- NEW HISTORY BUTTON --- */}
                <TouchableOpacity 
                    style={styles.historyButton}
                    onPress={() => router.push({ pathname: '/lotHistory', params: { manufacturerId } })}
                >
                    <MaterialCommunityIcons name="history" size={20} color={Colors.light.tint} />
                    <Text style={styles.historyButtonText}>View Lot History</Text>
                </TouchableOpacity>

                <Text style={styles.title}>Create New Lot</Text>
                <Text style={styles.subtitle}>For Manufacturer: {manufacturerId}</Text>
                
                <View style={styles.form}>
                    <TextInput style={styles.input} placeholder="Product Type (e.g., rail pads)" value={lotDetails.productType} onChangeText={t => setLotDetails({...lotDetails, productType: t})} />
                    <TextInput style={styles.input} placeholder="Quantity" value={lotDetails.quantity} onChangeText={t => setLotDetails({...lotDetails, quantity: t})} keyboardType="numeric" />
                    <TextInput style={styles.input} placeholder="Warranty in Months" value={lotDetails.warrantyMonths} onChangeText={t => setLotDetails({...lotDetails, warrantyMonths: t})} keyboardType="numeric" />
                </View>

                <TouchableOpacity style={styles.createButton} onPress={handleCreateLot}>
                    <Text style={styles.createButtonText}>Create Lot & Generate Products</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.light.background },
    content: { padding: 20 },
    historyButton: {
        position: 'absolute',
        top: 15,
        right: 20,
        flexDirection: 'row',
        alignItems: 'center',
        padding: 8,
    },
    historyButtonText: {
        color: Colors.light.tint,
        fontWeight: 'bold',
        marginLeft: 5,
    },
    title: { fontSize: 28, fontWeight: 'bold', marginBottom: 5, textAlign: 'center', marginTop: 40 },
    subtitle: { fontSize: 16, color: Colors.light.secondaryText, marginBottom: 30, textAlign: 'center' },
    form: { marginBottom: 30 },
    input: { height: 50, backgroundColor: Colors.light.card, borderRadius: 10, paddingHorizontal: 15, fontSize: 16, marginBottom: 15, borderWidth: 1, borderColor: '#ddd' },
    createButton: { backgroundColor: Colors.light.tint, padding: 15, borderRadius: 10, alignItems: 'center' },
    createButtonText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' }
});