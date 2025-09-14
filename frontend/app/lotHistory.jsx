
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, SafeAreaView, ActivityIndicator, Image } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getLotsByManufacturerId } from '../src/services/api';
import Colors from '../constants/Colors';

const LotCard = ({ lot }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [selectedProductIndex, setSelectedProductIndex] = useState(null);

    const productIds = lot.products.map(p => p.productId);
    const productQrs = lot.products.map(p => p.qrUrl);
    const productNumbers = lot.products.map((_, i) => i);

    const handleSelectProduct = (index) => {
        setSelectedProductIndex(selectedProductIndex === index ? null : index);
    };

    return (
        <TouchableOpacity style={styles.card} onPress={() => setIsExpanded(!isExpanded)} activeOpacity={0.8}>
            <View style={styles.cardHeader}>
                <View style={{ flex: 1 }}>
                    <Text style={styles.lotId}>{lot.lotId}</Text>
                    <Text style={styles.productType}>{lot.productType}</Text>
                </View>
                <MaterialCommunityIcons 
                    name={isExpanded ? "chevron-up" : "chevron-down"} 
                    size={24} 
                    color={Colors.light.secondaryText} 
                />
            </View>

            {isExpanded && (
                <View style={styles.expandedContainer}>
                    <Text style={styles.qrTitle}>Package QR Code</Text>
                    <Image style={styles.mainQr} source={{ uri: lot.lotQrUrl }} />

                    <View style={styles.divider} />
                    
                    <Text style={styles.qrTitle}>Individual Products ({lot.quantity})</Text>
                    <Text style={styles.instructions}>Tap a number to view its QR code.</Text>
                    
                    <View style={styles.numberGrid}>
                        {productNumbers.map((numIndex) => (
                            <TouchableOpacity
                                key={numIndex}
                                style={[styles.numberButton, selectedProductIndex === numIndex && styles.numberButtonSelected]}
                                onPress={() => handleSelectProduct(numIndex)}
                            >
                                <Text style={[styles.numberText, selectedProductIndex === numIndex && styles.numberTextSelected]}>
                                    {numIndex + 1}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {selectedProductIndex !== null && (
                        <View style={styles.selectedProductContainer}>
                            <Text style={styles.selectedTitle}>Product #{selectedProductIndex + 1}</Text>
                            <Image style={styles.individualQr} source={{ uri: productQrs[selectedProductIndex] }} />
                            <Text style={styles.selectedProductId}>{productIds[selectedProductIndex]}</Text>
                        </View>
                    )}
                </View>
            )}
        </TouchableOpacity>
    );
};

export default function LotHistoryScreen() {
    const { manufacturerId } = useLocalSearchParams();
    const [lots, setLots] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const response = await getLotsByManufacturerId(manufacturerId);
                const sortedLots = (response.data.lots || []).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                setLots(sortedLots);
            } catch (err) {
                setError("Failed to fetch lot history.");
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchHistory();
    }, [manufacturerId]);

    if (isLoading) {
        return <SafeAreaView style={styles.centerContainer}><ActivityIndicator size="large" color={Colors.light.tint} /></SafeAreaView>;
    }

    if (error) {
        return <SafeAreaView style={styles.centerContainer}><Text style={styles.errorText}>{error}</Text></SafeAreaView>;
    }

    return (
        <SafeAreaView style={styles.container}>
            <FlatList
                data={lots}
                renderItem={({ item }) => <LotCard lot={item} />}
                keyExtractor={(item) => item._id}
                contentContainerStyle={styles.listContent}
                ListHeaderComponent={
                    <Text style={styles.title}>Lot Creation History</Text>
                }
                ListEmptyComponent={
                    <View style={styles.centerContainer}>
                        <Text>No lots have been created by this manufacturer yet.</Text>
                    </View>
                }
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.light.background },
    centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    errorText: { color: 'red' },
    listContent: { padding: 20 },
    title: { fontSize: 28, fontWeight: 'bold', marginBottom: 20 },
    card: {
        backgroundColor: Colors.light.card,
        borderRadius: 15,
        padding: 20,
        marginBottom: 15,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 2,
    },
    cardHeader: { flexDirection: 'row', alignItems: 'center' },
    lotId: { fontSize: 12, color: Colors.light.secondaryText },
    productType: { fontSize: 16, fontWeight: 'bold' },
    expandedContainer: { marginTop: 15, paddingTop: 15, borderTopWidth: 1, borderTopColor: '#eee' },
    qrTitle: { fontSize: 16, fontWeight: '600', marginBottom: 10, textAlign: 'center' },
    mainQr: { width: 120, height: 120, alignSelf: 'center' },
    divider: { height: 1, backgroundColor: '#eee', marginVertical: 20 },
    instructions: { color: Colors.light.secondaryText, marginBottom: 10, textAlign: 'center', fontSize: 12 },
    numberGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' },
    numberButton: {
        width: 45, height: 45, borderRadius: 22.5,
        backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center',
        margin: 5, borderWidth: 1, borderColor: '#E5E7EB'
    },
    numberButtonSelected: { backgroundColor: Colors.light.tint, borderColor: Colors.light.tint },
    numberText: { fontWeight: 'bold' },
    numberTextSelected: { color: '#FFFFFF' },
    selectedProductContainer: {
        marginTop: 20, paddingTop: 15,
        borderTopWidth: 1, borderTopColor: '#eee', alignItems: 'center',
    },
    selectedTitle: { fontSize: 14, fontWeight: 'bold', marginBottom: 10 },
    individualQr: { width: 180, height: 180, marginBottom: 10 },
    selectedProductId: { fontSize: 11, textAlign: 'center', color: Colors.light.secondaryText },
});