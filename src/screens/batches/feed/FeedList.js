import React from "react";
import { View, Text, Button, TouchableOpacity } from "react-native";
import { useFeed } from "../../../modules/batches/hooks/useFeed";

export default function FeedList({ navigation, route }) {
  const { batchId } = route.params;
  const { feed } = useFeed(batchId);

  return (
    <View style={{ flex: 1, padding: 25 }}>
      <Text style={{ fontSize: 26, fontWeight: "700" }}>Feed Records</Text>

      <Button
        title="Add Feed Entry"
        onPress={() =>
          navigation.navigate("AddFeedEntry", { batchId })
        }
      />

      {feed.map((entry) => (
        <View
          key={entry.id}
          style={{
            padding: 16,
            marginTop: 12,
            backgroundColor: "#eee",
            borderRadius: 10,
          }}
        >
          <Text>Date: {entry.date}</Text>
          <Text>KG: {entry.feed_kg}</Text>
          <Text>Type: {entry.feed_type}</Text>
          <Text>Cost: ${entry.cost}</Text>
        </View>
      ))}
    </View>
  );
}
