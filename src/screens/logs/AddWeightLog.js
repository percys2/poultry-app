import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { supabase } from "../../lib/supabase/client";

const colors = {
  primary: '#2D5A27',
  primaryLight: '#4A7C43',
  cream: '#FDF8F3',
  beige: '#F5E6D3',
  sand: '#E8DCC8',
  textPrimary: '#2C2C2C',
  textSecondary: '#5C5C5C',
  textMuted: '#8C8C8C',
  textLight: '#FFFFFF',
  surface: '#FFFFFF',
  border: '#E8DCC8',
};

const LB_TO_KG = 0.453592;

export default function AddWeightLog({ route, navigation }) {
  const params = route?.params || {};
  const { batchId, batchName } = params;
  const [avgWeightLb, setAvgWeightLb] = useState("");
  const [sampleSize, setSampleSize] = useState("10");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSave() {
    if (!avgWeightLb || Number(avgWeightLb) <= 0) {
      return Alert.alert("Error", "Ingresa un peso promedio válido");
    }

    try {
      setLoading(true);

      const weightKg = Number(avgWeightLb) * LB_TO_KG;
      const weightG = weightKg * 1000;

      const { error } = await supabase.from("weight_logs").insert({
        batch_id: batchId,
        avg_weight_kg: weightKg,
        avg_weight_g: weightG,
        sample_size: sampleSize ? Number(sampleSize) : 10,
        notes: notes || null,
      });

      if (error) {
        setLoading(false);
        return Alert.alert("Error", error.message);
      }

      setLoading(false);
      Alert.alert("Registrado", "Peso registrado exitosamente", [
        { text: "OK", onPress: () => navigation.goBack() }
      ]);
    } catch (err) {
      setLoading(false);
      Alert.alert("Error", err.message);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Cancelar</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Registrar Peso</Text>
        <View style={{ width: 70 }} />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.batchInfo}>
            <Text style={styles.batchLabel}>Lote:</Text>
            <Text style={styles.batchName}>{batchName}</Text>
          </View>

          <View style={styles.formCard}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Peso promedio (libras) *</Text>
              <TextInput
                style={styles.input}
                placeholder="Ej: 2.5"
                placeholderTextColor={colors.textMuted}
                value={avgWeightLb}
                onChangeText={setAvgWeightLb}
                keyboardType="numeric"
              />
              <Text style={styles.hint}>Peso promedio por ave en libras</Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Tamaño de muestra</Text>
              <TextInput
                style={styles.input}
                placeholder="Ej: 10"
                placeholderTextColor={colors.textMuted}
                value={sampleSize}
                onChangeText={setSampleSize}
                keyboardType="numeric"
              />
              <Text style={styles.hint}>Cantidad de aves pesadas</Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Notas (opcional)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Observaciones..."
                placeholderTextColor={colors.textMuted}
                value={notes}
                onChangeText={setNotes}
                multiline
                numberOfLines={3}
              />
            </View>
          </View>

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleSave}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={colors.textLight} />
            ) : (
              <Text style={styles.buttonText}>Guardar registro</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border },
  backButton: { fontSize: 16, color: colors.primary, fontWeight: '500' },
  headerTitle: { fontSize: 18, fontWeight: '600', color: colors.textPrimary },
  content: { padding: 20 },
  batchInfo: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, padding: 16, backgroundColor: colors.beige, borderRadius: 12 },
  batchLabel: { fontSize: 14, color: colors.textMuted, marginRight: 8 },
  batchName: { fontSize: 16, fontWeight: '600', color: colors.textPrimary },
  formCard: { backgroundColor: colors.surface, borderRadius: 20, padding: 20, marginBottom: 24 },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '600', color: colors.textSecondary, marginBottom: 8 },
  input: { backgroundColor: colors.cream, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: colors.border, fontSize: 16, color: colors.textPrimary },
  hint: { fontSize: 12, color: colors.textMuted, marginTop: 4 },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  button: { backgroundColor: colors.primary, paddingVertical: 18, borderRadius: 14, alignItems: 'center' },
  buttonDisabled: { backgroundColor: colors.primaryLight },
  buttonText: { color: colors.textLight, fontWeight: '700', fontSize: 17 },
});