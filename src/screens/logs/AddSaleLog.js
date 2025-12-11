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
import DateTimePicker from "@react-native-community/datetimepicker";
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
  success: '#4CAF50',
};

const LB_TO_KG = 0.453592;

export default function AddSaleLog({ route, navigation }) {
  const params = route?.params || {};
  const { batchId, batchName } = params;
  const [quantityBirds, setQuantityBirds] = useState("");
  const [totalWeight, setTotalWeight] = useState("");
  const [pricePerLb, setPricePerLb] = useState("");
  const [totalRevenue, setTotalRevenue] = useState("");
  const [buyer, setBuyer] = useState("");
  const [notes, setNotes] = useState("");
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loading, setLoading] = useState(false);

  function formatDate(d) {
    return d.toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });
  }

  function onDateChange(event, selectedDate) {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) setDate(selectedDate);
  }

  function calculateRevenue() {
    if (totalWeight && pricePerLb) {
      const revenue = Number(totalWeight) * Number(pricePerLb);
      setTotalRevenue(revenue.toFixed(2));
    }
  }

  async function handleSave() {
    if (!quantityBirds || Number(quantityBirds) <= 0) {
      return Alert.alert("Error", "Ingresa la cantidad de aves vendidas");
    }
    if (!totalRevenue || Number(totalRevenue) <= 0) {
      return Alert.alert("Error", "Ingresa el ingreso total");
    }

    try {
      setLoading(true);
      const weightKg = totalWeight ? Number(totalWeight) * LB_TO_KG : null;
      const pricePerKg = pricePerLb ? Number(pricePerLb) / LB_TO_KG : null;

      const { error } = await supabase.from("sales_logs").insert({
        batch_id: batchId,
        date: date.toISOString().split('T')[0],
        quantity_birds: Number(quantityBirds),
        total_weight_kg: weightKg,
        price_per_kg: pricePerKg,
        total_revenue: Number(totalRevenue),
        buyer: buyer || null,
        notes: notes || null,
      });

      if (error) {
        setLoading(false);
        return Alert.alert("Error", error.message);
      }

      setLoading(false);
      Alert.alert("Registrado", "Venta registrada exitosamente", [
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
        <Text style={styles.headerTitle}>Registrar Venta</Text>
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
              <Text style={styles.label}>Fecha</Text>
              <TouchableOpacity style={styles.dateButton} onPress={() => setShowDatePicker(true)}>
                <Text style={styles.dateIcon}>📅</Text>
                <Text style={styles.dateText}>{formatDate(date)}</Text>
              </TouchableOpacity>
              {showDatePicker && (
                <DateTimePicker value={date} mode="date" display={Platform.OS === 'ios' ? 'spinner' : 'default'} onChange={onDateChange} maximumDate={new Date()} />
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Cantidad de aves vendidas *</Text>
              <TextInput style={styles.input} placeholder="Ej: 100" placeholderTextColor={colors.textMuted} value={quantityBirds} onChangeText={setQuantityBirds} keyboardType="numeric" />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Peso total (libras)</Text>
              <TextInput style={styles.input} placeholder="Ej: 550" placeholderTextColor={colors.textMuted} value={totalWeight} onChangeText={setTotalWeight} onBlur={calculateRevenue} keyboardType="numeric" />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Precio por libra</Text>
              <TextInput style={styles.input} placeholder="Ej: 15.00" placeholderTextColor={colors.textMuted} value={pricePerLb} onChangeText={setPricePerLb} onBlur={calculateRevenue} keyboardType="numeric" />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Ingreso total *</Text>
              <TextInput style={[styles.input, styles.revenueInput]} placeholder="Ej: 8250.00" placeholderTextColor={colors.textMuted} value={totalRevenue} onChangeText={setTotalRevenue} keyboardType="numeric" />
              <Text style={styles.hint}>Se calcula automáticamente si ingresas peso y precio por libra</Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Comprador (opcional)</Text>
              <TextInput style={styles.input} placeholder="Nombre del comprador" placeholderTextColor={colors.textMuted} value={buyer} onChangeText={setBuyer} />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Notas (opcional)</Text>
              <TextInput style={[styles.input, styles.textArea]} placeholder="Observaciones adicionales..." placeholderTextColor={colors.textMuted} value={notes} onChangeText={setNotes} multiline numberOfLines={3} />
            </View>
          </View>

          <TouchableOpacity style={[styles.button, loading && styles.buttonDisabled]} onPress={handleSave} disabled={loading}>
            {loading ? <ActivityIndicator color={colors.textLight} /> : <Text style={styles.buttonText}>Registrar venta</Text>}
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
  dateButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.cream, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: colors.border },
  dateIcon: { fontSize: 20, marginRight: 10 },
  dateText: { fontSize: 16, color: colors.textPrimary },
  revenueInput: { backgroundColor: '#E8F5E9', borderColor: colors.success },
  hint: { fontSize: 12, color: colors.textMuted, marginTop: 4 },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  button: { backgroundColor: colors.success, paddingVertical: 18, borderRadius: 14, alignItems: 'center' },
  buttonDisabled: { backgroundColor: '#A5D6A7' },
  buttonText: { color: colors.textLight, fontWeight: '700', fontSize: 17 },
});