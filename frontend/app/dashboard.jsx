
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, StatusBar, ScrollView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Colors from '../constants/Colors';

export default function DashboardScreen() {
  const router = useRouter();
  const { employeeId } = useLocalSearchParams();

  const handlePress = (screen, params) => {
    router.push({ pathname: screen, params });
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        <View style={styles.header}>
          <Text style={styles.welcomeText}>Welcome,</Text>
          <Text style={styles.employeeIdText}>{employeeId}</Text>
        </View>

        <TouchableOpacity 
          style={styles.primaryActionCard} 
          onPress={() => handlePress('/scanner', { scanMode: 'viewProductDetails', employeeId })}
        >
          <MaterialCommunityIcons name="qrcode-scan" size={50} color="#FFFFFF" />
          <Text style={styles.primaryActionTitle}>Scan Product QR</Text>
          <Text style={styles.primaryActionSubtitle}>to view its complete history and details</Text>
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>Other Tasks</Text>

        <View style={styles.secondaryActionsContainer}>
          <TouchableOpacity 
            style={styles.secondaryAction} 
            onPress={() => handlePress('/scanner', { scanMode: 'installProduct', employeeId })}
          >
            <MaterialCommunityIcons name="wrench-outline" size={24} color={Colors.light.text} />
            <Text style={styles.secondaryActionText}>Install a Product</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.secondaryAction} 
            onPress={() => handlePress('/productList', { employeeId })}
          >
            <MaterialCommunityIcons name="magnify" size={24} color={Colors.light.text} />
            <Text style={styles.secondaryActionText}>Browse Inventory</Text>
          </TouchableOpacity>

           <TouchableOpacity 
            style={styles.secondaryAction} 
            onPress={() => handlePress('/scanner', { scanMode: 'receiveLot', employeeId })}
          >
            <MaterialCommunityIcons name="archive-arrow-down-outline" size={24} color={Colors.light.text} />
            <Text style={styles.secondaryActionText}>Receive Lot Package</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },
  scrollContent: { padding: 20 },
  header: { marginBottom: 20, marginTop: 10 },
  welcomeText: { fontSize: 24, color: Colors.light.secondaryText },
  employeeIdText: { fontSize: 32, fontWeight: 'bold', color: Colors.light.text },
  primaryActionCard: {
    backgroundColor: Colors.light.tint,
    borderRadius: 20,
    padding: 25,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
    marginBottom: 40,
  },
  primaryActionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 10,
  },
  primaryActionSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.secondaryText,
    marginBottom: 15,
  },
  secondaryActionsContainer: {
    backgroundColor: Colors.light.card,
    borderRadius: 15,
    overflow: 'hidden',
  },
  secondaryAction: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.background,
  },
  secondaryActionText: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.light.text,
    marginLeft: 15,
  },
});