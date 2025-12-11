import React from "react";
import { View, Text, Button } from "react-native";
import { useExpenses } from "../../../modules/batches/hooks/useExpenses";

export default function ExpensesList({ navigation, route }) {
  const { batchId } = route.params;
  const { expenses } = useExpenses(batchId);

  return (
    <View style={{ flex: 1, padding: 25 }}>
      <Text style={{ fontSize: 26, fontWeight: "700" }}>Expenses</Text>

      <Button
        title="Add Expense"
        onPress={() =>
          navigation.navigate("AddExpenseEntry", { batchId })
        }
      />

      {expenses.map((e) => (
        <View
          key={e.id}
          style={{
            padding: 16,
            backgroundColor: "#eef",
            borderRadius: 8,
            marginTop: 12,
          }}
        >
          <Text>Date: {e.date}</Text>
          <Text>Category: {e.category}</Text>
          <Text>Description: {e.description}</Text>
          <Text>Amount: ${e.amount}</Text>
        </View>
      ))}
    </View>
  );
}
