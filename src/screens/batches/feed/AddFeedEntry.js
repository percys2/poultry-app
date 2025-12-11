import React, { useState } from "react";
import { View, Text, TextInput, Button, Alert } from "react-native";
import { addFeedEntry } from "../../../modules/batches/api/addFeedEntry";

export default function AddFeedEntry({ navigation, route }) {
  const { batchId } = route.params;

  const [feedKg, setFeedKg] = useState("");
  const [feedType, setFeedType] = useState("");
  const [cost, setCost] = useState("");

  async function save() {
    try {
      await addFeedEntry({
        batchId,
        date: new Date(),
        feedKg: Number(feedKg),
        feedType,
        cost: Number(cost),
      });

      Alert.alert("Success", "Feed entry added.");
      navigation.goBack();
    } catch (err) {
      Alert.alert("Error", err.message);
    }
  }

  return (
    <View style={{ flex: 1, padding: 25 }}>
      <Text style={{ fontSize: 26, fontWeight: "700" }}>Add Feed Entry</Text>

      <TextInput
        placeholder="Feed KG"
        keyboardType="numeric"
        value={feedKg}
        onChangeText={setFeedKg}
        style={styles.input}
      />

      <TextInput
        placeholder="Feed Type"
        value={feedType}
        onChangeText={setFeedType}
        style={styles.input}
      />

      <TextInput
        placeholder="Cost"
        keyboardType="numeric"
        value={cost}
        onChangeText={setCost}
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
