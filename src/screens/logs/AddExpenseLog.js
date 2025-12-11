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

const CATEGORIES = [
  { id: 'feed', label: 'Alimento', icon: '🌾' },
  { id: 'medicine', label: 'Medicinas', icon: '💊' },
  { id: 'labor', label: 'Mano de obra', icon: '👷' },
  { id: 'utilities', label: 'Servicios', icon: '💡' },
  { id: 'chicks', label: 'Pollitos', icon: '🐣' },
  { id: 'other', label: 'Otros', icon: '📦' },
];

export default function AddExpenseLog({ route, navigation }) {
  const params = route?.params || {};
  const { batchId, batchName } = params;
  const [category, setCategory] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSave() {
    if (!category) {
      return Alert.alert("Error", "Selecciona una categoría");
    }
    if (!amount || Number(amount) <= 0) {
      return Alert.alert("Error", "Ingresa un monto válido");
    }

    try {
      setLoading(true);

      const { error } = await supabase.from("expense_logs").insert({
        batch_id: batchId,
        category,
        amount: Number(amount),
        description: description || null,
      });

      if (error) {
        setLoading(false);
        return Alert.alert("Error", error.message);
      }

      setLoading(false);
      Alert.alert("Registrado", "Gasto registrado exitosamente", [
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
        <Text style={styles.headerTitle}>Registrar Gasto</Text>
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

          <View style={styles.formCard}>
            <Text style={styles.label}>Categoría *</Text>
            <View style={styles.categoryGrid}>
              {CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  style={[
                    styles.categoryButton,
                    category === cat.id && styles.categoryButtonActive
                  ]}
                  onPress={() => setCategory(cat.id)}
                >
                  <Text style={styles.categoryIcon}>{cat.icon}</Text>
                  <Text style={[
                    styles.categoryLabel,
                    category === cat.id && styles.categoryLabelActive
                  ]}>
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Monto *</Text>
              <TextInput
                style={styles.input}
                placeholder="Ej: 500.00"
                placeholderTextColor={colors.textMuted}
                value={amount}
                onChangeText={setAmount}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Descripción (opcional)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Detalle del gasto..."
                placeholderTextColor={colors.textMuted}
                value={description}
                onChangeText={setDescription}
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
              <Text style={styles.buttonText}>Guardar gasto</Text>
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
  label: { fontSize: 14, fontWeight: '600', color: colors.textSecondary, marginBottom: 12 },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 20 },
  categoryButton: { width: '31%', padding: 12, borderRadius: 12, backgroundColor: colors.cream, alignItems: 'center', marginBottom: 10, borderWidth: 2, borderColor: 'transparent' },
  categoryButtonActive: { borderColor: colors.primary, backgroundColor: colors.primaryLight + '15' },
  categoryIcon: { fontSize: 24, marginBottom: 4 },
  categoryLabel: { fontSize: 11, color: colors.textMuted, textAlign: 'center' },
  categoryLabelActive: { color: colors.primary, fontWeight: '600' },
  inputGroup: { marginBottom: 16 },
  input: { backgroundColor: colors.cream, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: colors.border, fontSize: 16, color: colors.textPrimary },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  button: { backgroundColor: colors.primary, paddingVertical: 18, borderRadius: 14, alignItems: 'center' },
  buttonDisabled: { backgroundColor: colors.primaryLight },
  buttonText: { color: colors.textLight, fontWeight: '700', fontSize: 17 },
});