import React from "react";
import { View, Text, Button } from "react-native";
import { useMortality } from "../../../modules/batches/hooks/useMortality";

export default function MortalityList({ navigation, route }) {
  const { batchId } = route.params;
  const { mortality } = useMortality(batchId);

  return (
    <View style={{ flex: 1, padding: 25 }}>
      <Text style={{ fontSize: 26, fontWeight: "700" }}>Mortality</Text>

      <Button
        title="Add Mortality Entry"
        onPress={() =>
          navigation.navigate("AddMortalityEntry", { batchId })
        }
      />

      {mortality.map((m) => (
        <View
          key={m.id}
          style={{
            padding: 16,
            backgroundColor: "#ffe5e5",
            borderRadius: 8,
            marginTop: 12,
          }}
        >
          <Text>Date: {m.date}</Text>
          <Text>Deaths: {m.dead_quantity}</Text>
          <Text>Cause: {m.cause}</Text>
        </View>
      ))}
    </View>
  );
}
