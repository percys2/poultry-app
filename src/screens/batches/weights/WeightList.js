import React from "react";
import { View, Text, Button } from "react-native";
import { useWeights } from "../../../modules/batches/hooks/useWeights";

export default function WeightList({ navigation, route }) {
  const { batchId } = route.params;
  const { weights } = useWeights(batchId);

  return (
    <View style={{ flex: 1, padding: 25 }}>
      <Text style={{ fontSize: 26, fontWeight: "700" }}>Weights</Text>

      <Button
        title="Add Weight Entry"
        onPress={() =>
          navigation.navigate("AddWeightEntry", { batchId })
        }
      />

      {weights.map((item) => (
        <View
          key={item.id}
          style={{
            padding: 16,
            backgroundColor: "#eee",
            borderRadius: 8,
            marginTop: 12,
          }}
        >
          <Text>Date: {item.date}</Text>
          <Text>Avg Weight: {item.weight_avg} kg</Text>
        </View>
      ))}
    </View>
  );
}
