import React, { useState } from "react";
import { View, Text, TextInput, Button, Alert } from "react-native";
import { addExpenseEntry } from "../../../modules/batches/api/addExpenseEntry";

export default function AddExpenseEntry({ navigation, route }) {
  const { batchId } = route.params;

  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");

  async function save() {
    try {
      await addExpenseEntry({
        batchId,
        date: new Date(),
        amount: Number(amount),
        category,
        description,
      });

      Alert.alert("Success", "Expense recorded.");
      navigation.goBack();
    } catch (err) {
      Alert.alert("Error", err.message);
    }
  }

  return (
    <View style={{ flex: 1, padding: 25 }}>
      <Text style={{ fontSize: 26, fontWeight: "700" }}>Add Expense</Text>

      <TextInput
        placeholder="Amount"
        keyboardType="numeric"
        value={amount}
        onChangeText={setAmount}
        style={styles.input}
      />

      <TextInput
        placeholder="Category"
        value={category}
        onChangeText={setCategory}
        style={styles.input}
      />

      <TextInput
        placeholder="Description"
        value={description}
        onChangeText={setDescription}
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
