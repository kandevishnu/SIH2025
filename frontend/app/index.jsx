import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, StatusBar } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Colors from '../constants/Colors';

export default function EntryScreen() {
    const router = useRouter();

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" />
            <View style={styles.content}>
                <MaterialCommunityIcons name="train" size={80} color={Colors.light.tint} />
                <Text style={styles.title}>QRail Track & Trace</Text>
                <Text style={styles.subtitle}>Select your role to begin</Text>

                <View style={styles.cardContainer}>
                    {/* Manufacturer Role */}
                    <TouchableOpacity 
                        style={styles.roleCard} 
                        onPress={() => router.push('/manufacturerAuth')}
                    >
                        <MaterialCommunityIcons name="factory" size={40} color={Colors.light.tint} />
                        <Text style={styles.roleTitle}>Manufacturer</Text>
                        <Text style={styles.roleDescription}>Create lots and generate product QR codes.</Text>
                    </TouchableOpacity>

                    {/* Employee Role */}
                    <TouchableOpacity 
                        style={styles.roleCard} 
                        onPress={() => router.push('/employeeLogin')}
                    >
                        <MaterialCommunityIcons name="account-hard-hat" size={40} color={Colors.light.tint} />
                        <Text style={styles.roleTitle}>Railways Employee</Text>
                        <Text style={styles.roleDescription}>Install, inspect, and track products on the field.</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.light.background,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        marginTop: 20,
    },
    subtitle: {
        fontSize: 16,
        color: Colors.light.secondaryText,
        marginTop: 8,
        marginBottom: 40,
    },
    cardContainer: {
        width: '100%',
    },
    roleCard: {
        backgroundColor: Colors.light.card,
        borderRadius: 15,
        padding: 25,
        marginBottom: 20,
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 5,
    },
    roleTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginTop: 15,
    },
    roleDescription: {
        fontSize: 14,
        color: Colors.light.secondaryText,
        textAlign: 'center',
        marginTop: 5,
    },
});