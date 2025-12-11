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
  error: '#E53935',
};

export default function AddMortalityLog({ route, navigation }) {
  const params = route?.params || {};
  const { batchId, batchName } = params;
  const [count, setCount] = useState("");
  const [cause, setCause] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSave() {
    if (!count || Number(count) <= 0) {
      return Alert.alert("Error", "Ingresa una cantidad válida");
    }

    try {
      setLoading(true);

      const { error } = await supabase.from("mortality_logs").insert({
        batch_id: batchId,
        count: Number(count),
        cause: cause || null,
        notes: notes || null,
      });

      if (error) {
        setLoading(false);
        return Alert.alert("Error", error.message);
      }

      setLoading(false);
      Alert.alert("Registrado", "Mortalidad registrada", [
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
        <Text style={styles.headerTitle}>Registrar Mortalidad</Text>
        <View style={{ width: 70 }} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.batchInfo}>
            <Text style={styles.batchLabel}>Lote:</Text>
            <Text style={styles.batchName}>{batchName}</Text>
          </View>

          <View style={styles.warningBox}>
            <Text style={styles.warningIcon}>⚠️</Text>
            <Text style={styles.warningText}>
              Registra las bajas del día para mantener un control preciso de mortalidad
            </Text>
          </View>

          <View style={styles.formCard}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Cantidad de bajas *</Text>
              <TextInput
                style={styles.input}
                placeholder="Ej: 3"
                placeholderTextColor={colors.textMuted}
                value={count}
                onChangeText={setCount}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Causa (opcional)</Text>
              <TextInput
                style={styles.input}
                placeholder="Ej: Enfermedad, Aplastamiento, Desconocida"
                placeholderTextColor={colors.textMuted}
                value={cause}
                onChangeText={setCause}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Notas (opcional)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Observaciones adicionales..."
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
  batchInfo: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, padding: 16, backgroundColor: colors.beige, borderRadius: 12 },
  batchLabel: { fontSize: 14, color: colors.textMuted, marginRight: 8 },
  batchName: { fontSize: 16, fontWeight: '600', color: colors.textPrimary },
  warningBox: { flexDirection: 'row', alignItems: 'center', padding: 14, backgroundColor: '#FFF3E0', borderRadius: 12, marginBottom: 20, borderWidth: 1, borderColor: '#FFE0B2' },
  warningIcon: { fontSize: 20, marginRight: 10 },
  warningText: { flex: 1, fontSize: 13, color: '#E65100', lineHeight: 18 },
  formCard: { backgroundColor: colors.surface, borderRadius: 20, padding: 20, marginBottom: 24 },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '600', color: colors.textSecondary, marginBottom: 8 },
  input: { backgroundColor: colors.cream, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: colors.border, fontSize: 16, color: colors.textPrimary },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  button: { backgroundColor: colors.error, paddingVertical: 18, borderRadius: 14, alignItems: 'center' },
  buttonDisabled: { backgroundColor: '#EF9A9A' },
  buttonText: { color: colors.textLight, fontWeight: '700', fontSize: 17 },
});