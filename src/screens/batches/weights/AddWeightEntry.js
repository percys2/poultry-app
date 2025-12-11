import React, { useState } from "react";
import { View, Text, TextInput, Button, Alert } from "react-native";
import { addWeightEntry } from "../../../modules/batches/api/addWeightEntry";

export default function AddWeightEntry({ navigation, route }) {
  const { batchId } = route.params;
  const [weight, setWeight] = useState("");

  async function save() {
    try {
      await addWeightEntry({
        batchId,
        date: new Date(),
        weightAvg: Number(weight),
      });

      Alert.alert("Success", "Weight entry added.");
      navigation.goBack(); 
    } catch (err) {
      Alert.alert("Error", err.message);
    }
  }

  return (
    <View style={{ flex: 1, padding: 25 }}>
      <Text style={{ fontSize: 26, fontWeight: "700" }}>Add Weight</Text>

      <TextInput
        placeholder="Average Weight (kg)"
        keyboardType="numeric"
        value={weight}
        onChangeText={setWeight}
        style={{
          borderWidth: 1,
          padding: 12,
          borderRadius: 8,
          marginTop: 20,
        }}
      />

      <Button title="Save" onPress={save} />
    </View>
  );
}
