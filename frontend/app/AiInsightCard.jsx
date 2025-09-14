import React, { useEffect, useState } from "react";
import { View, Text, ActivityIndicator } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import Colors from "../constants/Colors";

const AiInsightCard = ({ predictions }) => {
  const [typedInsight, setTypedInsight] = useState("");
  const [isTyping, setIsTyping] = useState(true);

  useEffect(() => {
    if (!predictions || predictions.length === 0) {
      setIsTyping(false);
      return;
    }

    const { insights = [], recommendations = [] } = predictions[0].ai_insights || {};
    const fullMessage = [...insights, ...recommendations].join(". ");

    if (!fullMessage) {
      setIsTyping(false);
      return;
    }

    let i = 0;
    const interval = setInterval(() => {
      setTypedInsight((prev) => prev + fullMessage.charAt(i));
      i++;
      if (i >= fullMessage.length) {
        clearInterval(interval);
        setIsTyping(false);
      }
    }, 40);

    return () => clearInterval(interval);
  }, [predictions]);

  if (!predictions) {
    return (
      <View style={styles.card}>
        <ActivityIndicator color={Colors.light.tint} />
        <Text>Fetching AI Insights...</Text>
      </View>
    );
  }

  if (predictions.length === 0) return null;

  return (
    <View style={styles.card}>
      <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
        <MaterialCommunityIcons name="auto-fix" size={20} color={Colors.light.tint} />
        <Text style={{ fontWeight: "bold", color: Colors.light.tint, marginLeft: 8 }}>AI Insights</Text>
      </View>
      <Text>{typedInsight}{isTyping && "|"}</Text>
    </View>
  );
};

const styles = {
  card: { backgroundColor: "#F0F5FF", padding: 15, borderRadius: 12, marginBottom: 15 },
};

export default AiInsightCard;
