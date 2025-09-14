
import React, { useState } from 'react';
import { 
    View, 
    Text, 
    StyleSheet, 
    TextInput, 
    TouchableOpacity, 
    FlatList, 
    ActivityIndicator, 
    SafeAreaView,
    Keyboard,
    ScrollView
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getProducts } from '../src/services/api';
import Colors from '../constants/Colors';

const STATUS_OPTIONS = ['in_stock', 'installed', 'in_condition', 'failure'];

const StatusBadge = ({ status }) => {
  const statusStyles = {
    in_stock: { backgroundColor: '#DBEAFE', color: '#1E40AF' },
    installed: { backgroundColor: '#D1FAE5', color: '#065F46' },
    needs_replacement: { backgroundColor: '#FEF9C3', color: '#854D0E' },
    failed: { backgroundColor: '#FEE2E2', color: '#991B1B' },
    in_condition: { backgroundColor: '#D1FAE5', color: '#065F46' },
  };
  const style = statusStyles[status] || { backgroundColor: '#E5E7EB', color: '#374151' };
  const formattedStatus = status ? status.replace(/_/g, ' ').toUpperCase() : 'UNKNOWN';
  
  return (
    <View style={[styles.badge, { backgroundColor: style.backgroundColor }]}>
      <Text style={[styles.badgeText, { color: style.color }]}>{formattedStatus}</Text>
    </View>
  );
};

export default function ProductListScreen() {
    const router = useRouter();
    const { employeeId } = useLocalSearchParams();
    
    const [filters, setFilters] = useState({ lotId: '', manufacturerId: '', status: '', productId: '' });
    const [products, setProducts] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [hasSearched, setHasSearched] = useState(false);

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const handleApplyFilters = async () => {
        Keyboard.dismiss();
        setIsLoading(true);
        setError(null);
        setHasSearched(true);
        try {
            const activeFilters = Object.fromEntries(
                Object.entries(filters).filter(([_, value]) => value)
            );
            const response = await getProducts(activeFilters);
            setProducts(response.data.products ?? response.data ?? []);
        } catch (err) {
            setError('Failed to fetch products. Check filters or your connection.');
            setProducts([]);
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };
    
    const clearFilters = () => {
        setFilters({ lotId: '', manufacturerId: '', status: '', productId: '' });
        setProducts([]);
        setHasSearched(false);
        setError(null);
    };

    const renderProductCard = ({ item }) => (
        <TouchableOpacity 
            style={styles.productCard}
            onPress={() => router.push({ 
                pathname: '/productDetail', 
                params: { productId: item.productId, employeeId } 
            })}
        >
            <View style={styles.cardIcon}><MaterialCommunityIcons name="tag-outline" size={24} color={Colors.light.tint} /></View>
            <View style={styles.cardInfo}>
                <Text style={styles.cardProductId} numberOfLines={1}>{item.productId}</Text>
                <Text style={styles.cardProductType}>{item.productType}</Text>
            </View>
            <StatusBadge status={item.currentStatus} />
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            <FlatList
                data={products}
                renderItem={renderProductCard}
                keyExtractor={(item) => item.productId}
                contentContainerStyle={{ paddingHorizontal: 20 }}
                ListHeaderComponent={
                    <>
                        <View style={styles.header}>
                            <Text style={styles.title}>Browse Inventory</Text>
                        </View>
                        <View style={styles.filterContainer}>
                            <Text style={styles.filterLabel}>Status</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.statusScrollView}>
                                {STATUS_OPTIONS.map(status => (
                                    <TouchableOpacity 
                                        key={status} 
                                        style={[styles.statusButton, filters.status === status && styles.statusButtonSelected]}
                                        onPress={() => handleFilterChange('status', filters.status === status ? '' : status)}
                                    >
                                        <Text style={[styles.statusButtonText, filters.status === status && styles.statusButtonTextSelected]}>
                                            {status.replace('_', ' ').toUpperCase()}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>

                            {/* --- NEW: Product ID search field --- */}
                            <Text style={styles.filterLabel}>Product ID</Text>
                            <TextInput
                                style={styles.searchInput}
                                placeholder="Enter exact Product ID..."
                                value={filters.productId}
                                onChangeText={text => handleFilterChange('productId', text)}
                            />

                            <Text style={styles.filterLabel}>Manufacturer ID</Text>
                            <TextInput
                                style={styles.searchInput}
                                placeholder="e.g., MFG001"
                                value={filters.manufacturerId}
                                onChangeText={text => handleFilterChange('manufacturerId', text)}
                            />

                            <Text style={styles.filterLabel}>Lot ID</Text>
                            <TextInput
                                style={styles.searchInput}
                                placeholder="Enter exact Lot ID..."
                                value={filters.lotId}
                                onChangeText={text => handleFilterChange('lotId', text)}
                            />
                            
                            <View style={styles.buttonRow}>
                                <TouchableOpacity style={[styles.actionButton, styles.clearButton]} onPress={clearFilters}>
                                    <Text style={[styles.actionButtonText, styles.clearButtonText]}>Clear</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={[styles.actionButton, styles.applyButton]} onPress={handleApplyFilters}>
                                    <MaterialCommunityIcons name="magnify" size={20} color="#FFFFFF" />
                                    <Text style={styles.actionButtonText}>Apply Filters</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </>
                }
                ListEmptyComponent={
                    !isLoading && hasSearched && (
                        <View style={styles.emptyContainer}>
                            <MaterialCommunityIcons name="package-variant-off" size={60} color="#D1D5DB" />
                            <Text style={styles.emptyText}>{error ? error : "No products found matching your filters."}</Text>
                        </View>
                    )
                }
            />
            {isLoading && <ActivityIndicator size="large" color={Colors.light.tint} style={styles.loadingIndicator}/>}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.light.background },
    header: { paddingVertical: 10 },
    title: { fontSize: 28, fontWeight: 'bold' },
    filterContainer: { 
        marginBottom: 20, 
        backgroundColor: Colors.light.card, 
        padding: 15, 
        borderRadius: 15 
    },
    filterLabel: { 
        fontSize: 14, 
        fontWeight: '500', 
        color: Colors.light.secondaryText, 
        marginBottom: 8, 
        marginTop: 10 
    },
    statusScrollView: { marginHorizontal: -5 },
    statusButton: {
        paddingVertical: 8,
        paddingHorizontal: 15,
        borderRadius: 20,
        backgroundColor: '#F3F4F6',
        marginHorizontal: 5,
        borderWidth: 1,
        borderColor: '#E5E7EB'
    },
    statusButtonSelected: {
        backgroundColor: Colors.light.tint,
        borderColor: Colors.light.tint
    },
    statusButtonText: {
        color: Colors.light.text,
        fontWeight: '600',
        fontSize: 12,
    },
    statusButtonTextSelected: {
        color: '#FFFFFF'
    },
    searchInput: {
        height: 50,
        backgroundColor: '#F9FAFB',
        borderRadius: 10,
        paddingHorizontal: 15,
        fontSize: 16,
        borderWidth: 1,
        borderColor: '#E5E7EB'
    },
    buttonRow: { 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        marginTop: 20 
    },
    actionButton: {
        flexDirection: 'row',
        padding: 15,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1,
    },
    applyButton: {
        backgroundColor: Colors.light.tint,
        marginLeft: 5,
    },
    clearButton: {
        backgroundColor: '#E5E7EB',
        marginRight: 5
    },
    actionButtonText: {
        color: '#FFFFFF',
        fontWeight: 'bold',
        marginLeft: 8,
    },
    clearButtonText: {
        color: Colors.light.text
    },
    loadingIndicator: {
        position: 'absolute',
        top: '60%',
        alignSelf: 'center'
    },
    productCard: {
        backgroundColor: Colors.light.card,
        borderRadius: 15,
        padding: 15,
        marginBottom: 15,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#eee'
    },
    cardIcon: {
        backgroundColor: '#F3F4F6',
        borderRadius: 10,
        padding: 10,
        marginRight: 15,
    },
    cardInfo: { flex: 1, marginRight: 10 },
    cardProductId: { fontSize: 12, color: Colors.light.secondaryText, marginBottom: 2 },
    cardProductType: { fontSize: 16, fontWeight: 'bold' },
    badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
    badgeText: { fontWeight: 'bold', fontSize: 10 },
    emptyContainer: {
        marginTop: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyText: {
        fontSize: 16,
        color: Colors.light.secondaryText,
        textAlign: 'center',
        marginTop: 15,
    }
});