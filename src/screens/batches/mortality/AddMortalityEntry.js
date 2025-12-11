import React, { useState } from "react";
import { View, Text, TextInput, Button, Alert } from "react-native";
import { addMortalityEntry } from "../../../modules/batches/api/addMortalityEntry";

export default function AddMortalityEntry({ navigation, route }) {
  const { batchId } = route.params;

  const [qty, setQty] = useState("");
  const [cause, setCause] = useState("");

  async function save() {
    try {
      await addMortalityEntry({
        batchId,
        date: new Date(),
        quantity: Number(qty),
        cause,
      });

      Alert.alert("Success", "Mortality entry recorded.");
      navigation.goBack();
    } catch (err) {
      Alert.alert("Error", err.message);
    }
  }

  return (
    <View style={{ flex: 1, padding: 25 }}>
      <Text style={{ fontSize: 26, fontWeight: "700" }}>Add Mortality</Text>

      <TextInput
        placeholder="Number of deaths"
        keyboardType="numeric"
        value={qty}
        onChangeText={setQty}
        style={styles.input}
      />

      <TextInput
        placeholder="Cause"
        value={cause}
        onChangeText={setCause}
        style={styles.input}
      />

      <Button title="Save" onPress={save} />
    </View>
  );
}

const styles = {
  input: {
    borderWidth: 1,
    padding: 12,
    borderRadius: 8,
    marginTop: 10,
  },
};
