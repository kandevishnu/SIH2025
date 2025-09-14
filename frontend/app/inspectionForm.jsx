import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ActivityIndicator, ScrollView, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import { getProductById, postInspection, getAiRecommendation } from '../src/services/api';
import Colors from '../constants/Colors';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const CLOUDINARY_URL = "https://api.cloudinary.com/v1_1/dw3phay5u/image/upload";
const UPLOAD_PRESET = "ssbxzz7h";

const uploadImageAsync = async (uri) => {
    const formData = new FormData();
    formData.append('file', {
        uri,
        name: `photo_${Date.now()}.jpg`,
        type: 'image/jpeg',
    });
    formData.append('upload_preset', UPLOAD_PRESET);
    try {
        const response = await fetch(CLOUDINARY_URL, {
            method: 'POST',
            body: formData,
            headers: { 'content-type': 'multipart/form-data' },
        });
        const data = await response.json();
        return data.secure_url;
    } catch (error) {
        console.error('Cloudinary Upload Error:', error);
        return null;
    }
};

export default function InspectionFormScreen() {
    const router = useRouter();
    const { productId, employeeId } = useLocalSearchParams();

    const [product, setProduct] = useState(null);
    const [pastInspections, setPastInspections] = useState([]);
    const [expandedIndex, setExpandedIndex] = useState(null);

    const [results, setResults] = useState({ condition: '', voltage: '', vibration: '' });
    const [isFailure, setIsFailure] = useState(false);
    const [recommendation, setRecommendation] = useState('');
    const [isFetchingRecommendation, setIsFetchingRecommendation] = useState(false);
    
    const [photoUris, setPhotoUris] = useState([]);
    const [gpsLocation, setGpsLocation] = useState(null);
    const [locationError, setLocationError] = useState('');
    const [trackLocation, setTrackLocation] = useState('');
    
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [uploadProgress, setUploadProgress] = useState('');

    useEffect(() => {
    console.log("Starting data fetch for productId:", productId);

    const fetchData = async () => {
        try {
            const productResponse = await getProductById(productId);
            setProduct(productResponse.data.product);
            const sortedInspections = (productResponse.data.inspections || []).sort((a, b) => new Date(b.date) - new Date(a.date));
            setPastInspections(sortedInspections);

            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                setLocationError('Permission to access location was denied');
                setIsLoading(false);
                return; 
            }

            let location = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.High,
                timeout: 10000,
            });
            
            const coords = {
                lat: location.coords.latitude,
                lng: location.coords.longitude,
            };
            setGpsLocation(coords);

            let addressResponse = await Location.reverseGeocodeAsync({
                latitude: coords.lat,
                longitude: coords.lng
            });

            if (addressResponse && addressResponse.length > 0) {
                const address = addressResponse[0];
                const addressParts = [address.name, address.street, address.district, address.city, address.postalCode, address.country].filter(Boolean);
                setTrackLocation([...new Set(addressParts)].join(', '));
            }

        } catch (error) {
            console.error("--- FAILED TO FETCH INITIAL DATA ---");
            console.error(error);
            Alert.alert('Error', 'Failed to fetch initial data. Please check connection and location settings.');
        } finally {
            setIsLoading(false);
        }
    };

    if (productId) {
        fetchData();
    } else {
        Alert.alert("Error", "Product ID is missing, cannot load inspection form.");
        setIsLoading(false);
    }
  }, [productId]);

      const handleGetAiRecommendation = async () => {
    if (!results.condition && !results.voltage && !results.vibration) {
        Alert.alert("Input Needed", "Please fill in the Condition, Voltage, or Vibration fields first to get an AI recommendation.");
        return;
    }
    setIsFetchingRecommendation(true);

    const aiPayload = {
        condition: results.condition,
        voltage_reading: parseFloat(results.voltage) || 0,
        vibration_level: parseFloat(results.vibration) || 0,
        past_inspection_data: pastInspections
    };

    try {
        const response = await getAiRecommendation(aiPayload);

        if (response.data) {
            const recommendationText = response.data.recommendation;
            const aiMessage = response.data.message;

            if (recommendationText) {
                setRecommendation(recommendationText);
            }
            
            if (aiMessage) {
                Alert.alert("AI Analysis", aiMessage);
            }
        } else {
            Alert.alert("AI Error", "The AI responded, but the recommendation was empty.");
        }
    } catch (error) {
        console.error("AI Recommendation Error:", JSON.stringify(error.response?.data || error.message));
        Alert.alert("AI Error", "Could not fetch an AI recommendation at this time.");
    } finally {
        setIsFetchingRecommendation(false);
    }
  };
    
    const handleTakePhoto = async () => {
        let permissionResult = await ImagePicker.requestCameraPermissionsAsync();
        if (permissionResult.granted === false) {
            alert("Camera permission is required!");
            return;
        }
        let result = await ImagePicker.launchCameraAsync({ quality: 0.5 });
        if (!result.canceled) {
            setPhotoUris([...photoUris, result.assets[0].uri]);
        }
    };

    const handleSubmit = async () => {
        if (!recommendation.trim()) {
            Alert.alert('Validation Error', 'Please enter a recommendation or generate one using the AI button.');
            return;
        }
        setIsSubmitting(true);
        
        const uploadedPhotoUrls = [];
        if (photoUris.length > 0) {
            let photoCount = 1;
            for (const uri of photoUris) {
                setUploadProgress(`Uploading photo ${photoCount} of ${photoUris.length}...`);
                const url = await uploadImageAsync(uri);
                if (url) uploadedPhotoUrls.push(url);
                photoCount++;
            }
        }
        setUploadProgress('Finalizing submission...');

        const inspectionData = {
            productId, inspector: employeeId, results,
            failure: isFailure, recommendation, gpsLocation, photos: uploadedPhotoUrls,
        };

        try {
            const response = await postInspection(inspectionData);
            const aiRecommendation = response.data.inspection?.recommendation;
            const newStatus = response.data.product?.currentStatus;
            let successMessage = `Report submitted successfully.`;
            if (aiRecommendation) successMessage += `\n\nAI Recommendation: "${aiRecommendation}"`;
            if (newStatus) successMessage += `\nUpdated Product Status: ${newStatus.toUpperCase()}`;
            Alert.alert('Success', successMessage, [{ text: 'OK', onPress: () => router.back() }]);
        } catch (error) {
            const errorDetails = JSON.stringify(error.response?.data || error.message, null, 2);
            Alert.alert('API Error Details', errorDetails);
        } finally {
            setIsSubmitting(false);
            setUploadProgress('');
        }
    };

    if (isLoading) {
        return <SafeAreaView style={styles.container}><ActivityIndicator size="large" style={{ flex: 1 }} /></SafeAreaView>;
    }

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.content}>
                <Text style={styles.title}>Product Inspection</Text>
                <Text style={styles.productId}>ID: {product?.productId}</Text>

                <Text style={styles.sectionTitle}>Inspection History</Text>
                {pastInspections && pastInspections.length > 0 ? (
                    pastInspections.slice(0, 3).map((insp, index) => (
                        <TouchableOpacity 
                            key={index} 
                            style={styles.historyCard} 
                            onPress={() => setExpandedIndex(expandedIndex === index ? null : index)}
                        >
                            <View style={styles.historyHeader}>
                                <Text style={styles.historyDate}>{new Date(insp.date).toLocaleDateString()}</Text>
                            </View>
                            <Text>Inspector: {insp.inspector}</Text>
                            <Text>Status: <Text style={{fontWeight: 'bold'}}>{insp.failure ? 'Failure' : 'In Condition'}</Text></Text>
                            <Text>AI Recommendation: <Text style={{ fontWeight: 'bold' }}>{insp.recommendation}</Text></Text>

                            {expandedIndex === index && (
                                <View style={styles.expandedDetails}>
                                    <Text style={styles.detailTitle}>Full Details</Text>
                                    {insp.results && Object.entries(insp.results).map(([key, value]) => (
                                        <Text key={key}>- {key.charAt(0).toUpperCase() + key.slice(1)}: {value}</Text>
                                    ))}
                                    {insp.photos && insp.photos.length > 0 && (
                                        <>
                                            <Text style={styles.detailTitle}>Photos</Text>
                                            <View style={styles.photoGrid}>
                                                {insp.photos.map((url, i) => <Image key={i} source={{ uri: url }} style={styles.thumbnail} />)}
                                            </View>
                                        </>
                                    )}
                                </View>
                            )}
                        </TouchableOpacity>
                    ))
                ) : (
                    <Text style={styles.noHistoryText}>No inspection history found.</Text>
                )}

                <Text style={styles.sectionTitle}>New Inspection Report</Text>
                <View style={styles.formCard}>
                    <Text style={styles.label}>Inspection Results</Text>
                    <TextInput placeholder="Condition (Good, Worn, Damaged)" style={styles.input} onChangeText={t => setResults({ ...results, condition: t })} />
                    <TextInput placeholder="Voltage Reading (200-250V)" style={styles.input} keyboardType="numeric" onChangeText={t => setResults({ ...results, voltage: t })} />
                    <TextInput placeholder="Vibration Level (1-7Hz)" style={styles.input} keyboardType="numeric" onChangeText={t => setResults({ ...results, vibration: t })} />

                    <Text style={styles.label}>Location Details</Text>
                    <View style={[styles.input, styles.locationBox]}>
                        <View style={{flexDirection: 'row', alignItems: 'center'}}>
                            <MaterialCommunityIcons name="map-marker-outline" size={20} color={Colors.light.secondaryText} />
                            <Text style={styles.locationText} numberOfLines={2}>{trackLocation || 'Fetching address...'}</Text>
                        </View>
                        <Text style={styles.gpsText}>
                            {gpsLocation ? `Lat: ${gpsLocation.lat.toFixed(4)}, Lng: ${gpsLocation.lng.toFixed(4)}` : locationError || 'Fetching GPS...'}
                        </Text>
                    </View>

                    <Text style={styles.label}>Recommendation</Text>
                    <View style={styles.recommendationInputContainer}>
                        <TextInput 
                            placeholder="Enter manual recommendation or get AI suggestion" 
                            style={styles.recommendationInput} 
                            value={recommendation}
                            onChangeText={setRecommendation}
                            multiline
                        />
                        <TouchableOpacity style={styles.aiButton} onPress={handleGetAiRecommendation} disabled={isFetchingRecommendation}>
                            {isFetchingRecommendation ? 
                                <ActivityIndicator color={Colors.light.tint} /> : 
                                <MaterialCommunityIcons name="auto-fix" size={24} color={Colors.light.tint} />
                            }
                        </TouchableOpacity>
                    </View>

                    <Text style={styles.label}>Final Status</Text>
                    <View style={styles.statusBox}>
                        <TouchableOpacity style={[styles.recButton, !isFailure && styles.recButtonSelected]} onPress={() => setIsFailure(false)}>
                            <Text style={[styles.recButtonText, !isFailure && { color: '#FFF' }]}>In Condition</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.recButton, isFailure && styles.recButtonSelected]} onPress={() => setIsFailure(true)}>
                            <Text style={[styles.recButtonText, isFailure && { color: '#FFF' }]}>Failure</Text>
                        </TouchableOpacity>
                    </View>
                    
                    <TouchableOpacity style={styles.photoButton} onPress={handleTakePhoto}>
                        <Text style={styles.photoButtonText}>Add Photo</Text>
                    </TouchableOpacity>
                    <View style={styles.photoGrid}>
                        {photoUris.map((uri, index) => <Image key={index} source={{ uri }} style={styles.thumbnail} />)}
                    </View>
                </View>

                {isSubmitting && uploadProgress ? (
                    <Text style={styles.uploadProgressText}>{uploadProgress}</Text>
                ) : null}

                <TouchableOpacity style={styles.submitButton} onPress={handleSubmit} disabled={isSubmitting}>
                    {isSubmitting ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.submitButtonText}>Submit Report</Text>}
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.light.background },
    content: { padding: 20 },
    title: { fontSize: 28, fontWeight: 'bold' },
    productId: { fontSize: 14, color: Colors.light.secondaryText, marginBottom: 20 },
    sectionTitle: { fontSize: 20, fontWeight: 'bold', marginTop: 20, marginBottom: 10, borderBottomWidth: 1, borderBottomColor: '#ddd', paddingBottom: 5 },
    historyCard: { backgroundColor: Colors.light.card, padding: 15, borderRadius: 10, marginBottom: 10, borderWidth: 1, borderColor: '#eee' },
    historyHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    historyDate: { fontWeight: 'bold', marginBottom: 5 },
    noHistoryText: { fontStyle: 'italic', color: Colors.light.secondaryText, padding: 20, textAlign: 'center' },
    expandedDetails: { marginTop: 15, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#f0f0f0' },
    detailTitle: { fontWeight: 'bold', marginTop: 5, marginBottom: 5 },
    formCard: { backgroundColor: Colors.light.card, padding: 15, borderRadius: 10 },
    label: { fontSize: 16, color: Colors.light.secondaryText, marginTop: 15, marginBottom: 5 },
    input: { width: '100%', minHeight: 50, backgroundColor: '#f0f0f0', borderRadius: 10, paddingHorizontal: 15, fontSize: 16, marginBottom: 10, justifyContent: 'center' },
    locationBox: { paddingVertical: 10, justifyContent: 'center' },
    locationText: { fontSize: 14, color: Colors.light.text, marginLeft: 10, flex: 1 },
    gpsText: { fontSize: 12, color: Colors.light.secondaryText, marginTop: 5, marginLeft: 30 },
    recommendationInputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f0f0f0', borderRadius: 10 },
    recommendationInput: { flex: 1, minHeight: 80, padding: 15, fontSize: 16, textAlignVertical: 'top' },
    aiButton: { padding: 10, marginRight: 5 },
    statusBox: { flexDirection: 'row', justifyContent: 'space-between' },
    recButton: { flex: 1, padding: 15, borderRadius: 10, borderWidth: 1, borderColor: Colors.light.tint, alignItems: 'center', marginHorizontal: 5 },
    recButtonSelected: { backgroundColor: Colors.light.tint },
    recButtonText: { fontWeight: 'bold', color: Colors.light.tint },
    photoButton: { backgroundColor: '#e9e9e9', padding: 15, borderRadius: 10, alignItems: 'center', marginTop: 20 },
    photoButtonText: { fontWeight: 'bold', color: Colors.light.text },
    photoGrid: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 10 },
    thumbnail: { width: 80, height: 80, borderRadius: 10, margin: 5 },
    uploadProgressText: { textAlign: 'center', marginTop: 15, color: Colors.light.secondaryText, fontStyle: 'italic' },
    submitButton: { marginTop: 15, width: '100%', height: 50, backgroundColor: Colors.light.tint, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
    submitButtonText: { color: '#FFFFFF', fontSize: 18, fontWeight: 'bold' },
});