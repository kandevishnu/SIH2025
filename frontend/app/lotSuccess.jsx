
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Image } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Colors from '../constants/Colors';

const InfoRow = ({ label, value }) => (
    <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
    </View>
);

export default function LotSuccessScreen() {
    const router = useRouter();
    const { responseData } = useLocalSearchParams();
    
    const data = JSON.parse(responseData);
    const { lot, productIds, productQrs, packageQr } = data;

    const [selectedProductIndex, setSelectedProductIndex] = useState(null);

    const productNumbers = Array.from({ length: lot.quantity }, (_, i) => i);

    const handleSelectProduct = (index) => {
        setSelectedProductIndex(selectedProductIndex === index ? null : index);
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.header}>
                    <MaterialCommunityIcons name="check-circle-outline" size={50} color="#22C55E" />
                    <Text style={styles.title}>Lot Created Successfully!</Text>
                </View>

                {/* Lot Details Card */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Lot Details</Text>
                    <InfoRow label="Lot ID" value={lot.lotId} />
                    <InfoRow label="Product Type" value={lot.productType} />
                    <InfoRow label="Quantity" value={lot.quantity} />
                    <InfoRow label="Warranty" value={`${lot.warrantyMonths} months`} />
                </View>

                {/* The "Package Box" */}
                <View style={styles.packageBox}>
                    <Text style={styles.cardTitle}>Package QR Code</Text>
                    <Image style={styles.mainQr} source={{ uri: packageQr }} />
                    <View style={styles.divider} />

                    <Text style={styles.cardTitle}>Products in this Lot</Text>
                    <Text style={styles.instructions}>Tap a number to view its individual QR code.</Text>
                    
                    {/* Grid of clickable product numbers */}
                    <View style={styles.numberGrid}>
                        {productNumbers.map((numIndex) => (
                            <TouchableOpacity
                                key={numIndex}
                                style={[
                                    styles.numberButton,
                                    selectedProductIndex === numIndex && styles.numberButtonSelected
                                ]}
                                onPress={() => handleSelectProduct(numIndex)}
                            >
                                <Text style={[
                                    styles.numberText,
                                    selectedProductIndex === numIndex && styles.numberTextSelected
                                ]}>
                                    {numIndex + 1}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Display area for the selected product's QR and ID */}
                    {selectedProductIndex !== null && (
                        <View style={styles.selectedProductContainer}>
                            <Text style={styles.selectedTitle}>Product #{selectedProductIndex + 1}</Text>
                            <Image style={styles.individualQr} source={{ uri: productQrs[selectedProductIndex] }} />
                            <Text style={styles.selectedProductIdLabel}>Product ID:</Text>
                            <Text style={styles.selectedProductId}>{productIds[selectedProductIndex]}</Text>
                        </View>
                    )}
                </View>

            </ScrollView>
            <TouchableOpacity style={styles.doneButton} onPress={() => router.back()}>
                <Text style={styles.doneButtonText}>Create Another Lot</Text>
            </TouchableOpacity>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.light.background },
    scrollContent: { padding: 20, paddingBottom: 100 },
    header: { alignItems: 'center', marginBottom: 20 },
    title: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginTop: 10 },
    card: {
        backgroundColor: Colors.light.card,
        borderRadius: 15,
        padding: 20,
        marginBottom: 20,
    },
    cardTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15 },
    infoRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    infoLabel: { fontSize: 14, color: Colors.light.secondaryText },
    infoValue: { fontSize: 14, fontWeight: '500', flexShrink: 1, textAlign: 'right' },
    packageBox: {
        backgroundColor: '#F3EFEA',
        borderRadius: 15,
        padding: 20,
        borderWidth: 1,
        borderColor: '#DCDCDC'
    },
    mainQr: { width: 150, height: 150, alignSelf: 'center', marginBottom: 15 },
    divider: { height: 1, backgroundColor: '#DCDCDC', marginVertical: 20 },
    instructions: { color: Colors.light.secondaryText, marginBottom: 15, textAlign: 'center' },
    numberGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' },
    numberButton: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: Colors.light.card,
        justifyContent: 'center',
        alignItems: 'center',
        margin: 8,
        borderWidth: 2,
        borderColor: '#E5E7EB'
    },
    numberButtonSelected: {
        backgroundColor: Colors.light.tint,
        borderColor: Colors.light.tint
    },
    numberText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: Colors.light.text
    },
    numberTextSelected: {
        color: '#FFFFFF'
    },
    selectedProductContainer: {
        marginTop: 20,
        paddingTop: 20,
        borderTopWidth: 1,
        borderTopColor: '#DCDCDC',
        alignItems: 'center',
    },
    selectedTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 10 },
    individualQr: { width: 200, height: 200, marginBottom: 10 },
    selectedProductIdLabel: { fontSize: 12, color: Colors.light.secondaryText },
    selectedProductId: { fontSize: 12, textAlign: 'center', paddingHorizontal: 10 },
    doneButton: { backgroundColor: Colors.light.tint, padding: 15, margin: 20, borderRadius: 10, alignItems: 'center' },
    doneButtonText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' }
});