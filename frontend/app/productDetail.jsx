import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { getProductById, getAiPredictions } from "../src/services/api";
import Colors from "../constants/Colors";
import AiInsightCard from "../app/AiInsightCard";

const getInferredStatus = (inspection) => {
  const condition = inspection.results?.condition?.toLowerCase() || '';
  const recommendation = inspection.recommendation?.toLowerCase() || '';
  if (condition === 'bad' || condition === 'damaged' || condition === 'worn') return 'failure';
  if (recommendation.includes('replace') || recommendation.includes('repair') || recommendation.includes('bad')) return 'failure';
  return 'in_condition';
};

const StatusBadge = ({ status, isCompact = false }) => {
  const statusStyles = {
    in_stock: { backgroundColor: "#DBEAFE", color: "#1E40AF" },
    installed: { backgroundColor: "#D1FAE5", color: "#065F46" },
    needs_replacement: { backgroundColor: "#FEF9C3", color: "#854D0E" },
    failed: { backgroundColor: "#FEE2E2", color: "#991B1B" },
    failure: { backgroundColor: "#FEE2E2", color: "#991B1B" },
    manufactured: { backgroundColor: "#E5E7EB", color: "#374151" },
    in_condition: { backgroundColor: "#D1FAE5", color: "#065F46" },
  };
  const style = statusStyles[status] || statusStyles['manufactured'];
  const formattedStatus = status ? status.replace(/_/g, " ").toUpperCase() : "UNKNOWN";
  const badgeStyles = isCompact ? [styles.badgeCompact, { backgroundColor: style.backgroundColor }] : [styles.badge, { backgroundColor: style.backgroundColor }];
  const textStyles = isCompact ? [styles.badgeTextCompact, { color: style.color }] : [styles.badgeText, { color: style.color }];
  return <View style={badgeStyles}><Text style={textStyles}>{formattedStatus}</Text></View>;
};

const InfoRow = ({ icon, label, value }) => (
  <View style={styles.infoRow}>
    <MaterialCommunityIcons name={icon} size={20} color={Colors.light.secondaryText} style={styles.infoIcon} />
    <Text style={styles.infoLabel}>{label}</Text>
    <Text style={styles.infoValue}>{value || "N/A"}</Text>
  </View>
);

const InfoCard = ({ title, children }) => (
  <View style={styles.card}>
    <Text style={styles.cardTitle}>{title}</Text>
    {children}
  </View>
);

export default function ProductDetailScreen() {
  const router = useRouter();
  const { productId, employeeId } = useLocalSearchParams();
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [aiPredictions, setAiPredictions] = useState(null);
  const [expandedIndex, setExpandedIndex] = useState(null);
  const [visibleInspections, setVisibleInspections] = useState(3);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const productResponse = await getProductById(productId);
        if (productResponse.data.inspections) {
          productResponse.data.inspections.sort((a, b) => new Date(b.date) - new Date(a.date));
        }
        setData(productResponse.data);
      } catch (err) {
        setError("Failed to fetch product details. Please check your connection.");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    const fetchAI = async () => {
      const predictions = await getAiPredictions(productId);
      setAiPredictions(predictions);
    };

    if (productId) {
      fetchData();
      fetchAI();
    }
  }, [productId]);

  if (isLoading) return <SafeAreaView style={styles.centerContainer}><ActivityIndicator size="large" color={Colors.light.tint} /></SafeAreaView>;
  if (error) return <SafeAreaView style={styles.centerContainer}><Text style={styles.errorText}>{error}</Text></SafeAreaView>;
  if (!data || !data.product) return <SafeAreaView style={styles.centerContainer}><Text>No data found for this product.</Text></SafeAreaView>;

  const { product, tms, udm, inspections } = data;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.productId} selectable>{product.productId}</Text>
          <StatusBadge status={product.currentStatus} />
        </View>

        <AiInsightCard predictions={aiPredictions} />

        {/* Product Info */}
        <InfoCard title="Product Information">
          <InfoRow icon="tag-outline" label="Type" value={product.productType} />
          <InfoRow icon="factory" label="Manufacturer" value={product.manufacturerId} />
          <InfoRow icon="calendar-month" label="Manufactured" value={product.manufactureDate ? new Date(product.manufactureDate).toLocaleDateString() : "N/A"} />
          <InfoRow icon="shield-check-outline" label="Warranty" value={`${product.warrantyMonths || "N/A"} months`} />
        </InfoCard>

        {tms && (
          <InfoCard title="Installation Details (TMS)">
            <InfoRow icon="map-marker-outline" label="Track Location" value={tms.trackLocation} />
            <InfoRow icon="account-hard-hat" label="Installed By" value={tms.installedBy} />
            <InfoRow icon="calendar-check" label="Installed On" value={tms.installedDate ? new Date(tms.installedDate).toLocaleDateString() : "N/A"} />
            {tms.gpsLocation && <InfoRow icon="crosshairs-gps" label="GPS" value={`${tms.gpsLocation.lat.toFixed(4)}, ${tms.gpsLocation.lng.toFixed(4)}`} />}
            <InfoRow icon="note-text-outline" label="Notes" value={tms.additionalNotes} />
          </InfoCard>
        )}

        {udm && (
          <InfoCard title="Depot Information (UDM)">
            <InfoRow icon="warehouse" label="Depot ID" value={udm.depotId} />
            <InfoRow icon="receipt" label="Receipt ID" value={udm.receiptId} />
            <InfoRow icon="account-eye-outline" label="Depot Inspector" value={udm.inspector} />
            <InfoRow icon="package-variant-closed" label="Depot Status" value={udm.status} />
          </InfoCard>
        )}

        <View style={styles.historySection}>
          <Text style={styles.cardTitle}>Inspection History</Text>
          {inspections && inspections.length > 0 ? (
            <>
              {inspections.slice(0, visibleInspections).map((insp, index) => (
                <TouchableOpacity key={index} style={styles.historyCard} onPress={() => setExpandedIndex(expandedIndex === index ? null : index)}>
                  <View style={styles.historyHeader}>
                    <Text style={styles.historyDate}>{new Date(insp.date).toLocaleDateString()}</Text>
                    <StatusBadge status={getInferredStatus(insp)} isCompact={true} />
                  </View>
                  <Text style={styles.historyInspector}>Inspector: {insp.inspector}</Text>
                  <Text style={styles.historyText}>AI Recommendation: <Text style={{ fontWeight: "bold" }}>{insp.recommendation}</Text></Text>
                  {expandedIndex === index && (
                    <View style={styles.expandedDetails}>
                      {insp.results && Object.entries(insp.results).map(([key, value]) => (
                        <Text style={styles.detailText} key={key}>- {key.charAt(0).toUpperCase() + key.slice(1)}: {value}</Text>
                      ))}
                      {insp.photos && insp.photos.length > 0 && (
                        <View style={styles.photoGrid}>
                          {insp.photos.map((url, i) => <Image key={i} source={{ uri: url }} style={styles.thumbnail}/>)}
                        </View>
                      )}
                    </View>
                  )}
                </TouchableOpacity>
              ))}
              {inspections.length > visibleInspections && (
                <TouchableOpacity style={styles.showMoreButton} onPress={() => setVisibleInspections((prev) => prev + 3)}>
                  <Text style={styles.showMoreButtonText}>Show More</Text>
                </TouchableOpacity>
              )}
            </>
          ) : (
            <Text style={styles.noHistoryText}>No inspection history found.</Text>
          )}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={[styles.actionButton, styles.secondaryButton]} onPress={() => router.push({ pathname: "/installForm", params: { productId, employeeId } })}>
          <MaterialCommunityIcons name="wrench-outline" size={20} color={Colors.light.tint} />
          <Text style={[styles.actionButtonText, styles.secondaryButtonText]}>Install Product</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={() => router.push({ pathname: "/inspectionForm", params: { productId, employeeId } })}>
          <MaterialCommunityIcons name="clipboard-check-outline" size={20} color="#FFFFFF" />
          <Text style={styles.actionButtonText}>Start Inspection</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },
  centerContainer: { flex: 1, justifyContent: "center", alignItems: "center", padding: 20 },
  scrollContent: { padding: 20, paddingBottom: 120 },
  errorText: { color: "red", fontSize: 16, textAlign: "center" },
  header: { marginBottom: 20, alignItems: "center" },
  productId: { fontSize: 16, color: Colors.light.secondaryText, marginBottom: 10, fontFamily: 'monospace' },
  aiCard: { backgroundColor: '#F0F5FF', borderRadius: 15, padding: 20, marginBottom: 20, borderWidth: 1, borderColor: '#D6E4FF' },
  aiHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  aiTitle: { fontSize: 16, fontWeight: 'bold', color: Colors.light.tint, marginLeft: 8 },
  aiText: { fontSize: 15, color: '#334155', lineHeight: 22 },
  cursor: { color: Colors.light.tint, fontWeight: 'bold' },
  badge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  badgeText: { fontWeight: "bold", fontSize: 12 },
  badgeCompact: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  badgeTextCompact: { fontWeight: '600', fontSize: 10 },
  card: { backgroundColor: Colors.light.card, borderRadius: 15, padding: 20, marginBottom: 15 },
  cardTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 15, color: Colors.light.text },
  infoRow: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  infoIcon: { marginRight: 15 },
  infoLabel: { fontSize: 16, color: Colors.light.secondaryText },
  infoValue: { fontSize: 16, fontWeight: "500", color: Colors.light.text, flex: 1, textAlign: "right" },
  historySection: { marginTop: 10 },
  historyCard: { backgroundColor: Colors.light.card, padding: 15, borderRadius: 10, marginBottom: 10 },
  historyHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 },
  historyDate: { fontWeight: "bold", fontSize: 14 },
  historyInspector: { fontSize: 12, color: Colors.light.secondaryText, marginBottom: 5 },
  historyText: { fontSize: 14 },
  noHistoryText: { fontStyle: "italic", color: Colors.light.secondaryText, textAlign: "center", marginTop: 10 },
  expandedDetails: { marginTop: 15, paddingTop: 10, borderTopWidth: 1, borderTopColor: "#f0f0f0" },
  detailText: { fontSize: 14, color: Colors.light.secondaryText, marginBottom: 3, },
  photoGrid: { flexDirection: "row", flexWrap: "wrap", marginTop: 10 },
  thumbnail: { width: 60, height: 60, borderRadius: 8, margin: 4 },
  showMoreButton: { backgroundColor: "#F3F4F6", borderRadius: 10, paddingVertical: 12, alignItems: "center", marginTop: 10 },
  showMoreButtonText: { color: Colors.light.secondaryText, fontWeight: "bold" },
  footer: { position: "absolute", bottom: 0, left: 0, right: 0, padding: 20, paddingTop: 10, backgroundColor: Colors.light.background, borderTopWidth: 1, borderTopColor: '#eee', flexDirection: 'row', justifyContent: 'space-between' },
  actionButton: { backgroundColor: Colors.light.tint, borderRadius: 15, paddingVertical: 15, flexDirection: "row", alignItems: "center", justifyContent: "center", flex: 1, marginHorizontal: 5 },
  actionButtonText: { color: "#FFFFFF", fontSize: 16, fontWeight: "bold", marginLeft: 10 },
  secondaryButton: { backgroundColor: Colors.light.card, borderWidth: 1, borderColor: Colors.light.tint },
  secondaryButtonText: { color: Colors.light.tint }
});