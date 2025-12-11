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
  vaccine: '#9C27B0',
};

const APPLICATION_METHODS = [
  { id: 'drinking_water', label: 'Agua de bebida', icon: '💧' },
  { id: 'spray', label: 'Aspersión', icon: '🌫️' },
  { id: 'injection', label: 'Inyección', icon: '💉' },
  { id: 'eye_drop', label: 'Gota ocular', icon: '👁️' },
  { id: 'other', label: 'Otro', icon: '📋' },
];

export default function AddVaccinationLog({ route, navigation }) {
  const params = route?.params || {};
  const { batchId, batchName } = params;
  const [vaccineName, setVaccineName] = useState("");
  const [applicationMethod, setApplicationMethod] = useState("");
  const [dose, setDose] = useState("");
  const [notes, setNotes] = useState("");
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loading, setLoading] = useState(false);

  function formatDate(d) {
    return d.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  function onDateChange(event, selectedDate) {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setDate(selectedDate);
    }
  }

  async function handleSave() {
    if (!vaccineName.trim()) {
      return Alert.alert("Error", "Ingresa el nombre de la vacuna");
    }

    try {
      setLoading(true);

      const { error } = await supabase.from("vaccination_logs").insert({
        batch_id: batchId,
        date: date.toISOString().split('T')[0],
        vaccine_name: vaccineName.trim(),
        application_method: applicationMethod || null,
        dose: dose || null,
        notes: notes || null,
      });

      if (error) {
        setLoading(false);
        return Alert.alert("Error", error.message);
      }

      setLoading(false);
      Alert.alert("Registrado", "Vacunación registrada exitosamente", [
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
        <Text style={styles.headerTitle}>Registrar Vacuna</Text>
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
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Fecha</Text>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setShowDatePicker(true)}
              >
                <Text style={styles.dateIcon}>📅</Text>
                <Text style={styles.dateText}>{formatDate(date)}</Text>
              </TouchableOpacity>
              {showDatePicker && (
                <DateTimePicker
                  value={date}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={onDateChange}
                  maximumDate={new Date()}
                />
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Nombre de la vacuna *</Text>
              <TextInput
                style={styles.input}
                placeholder="Ej: Newcastle, Gumboro, Bronquitis"
                placeholderTextColor={colors.textMuted}
                value={vaccineName}
                onChangeText={setVaccineName}
              />
            </View>

            <Text style={styles.label}>Método de aplicación</Text>
            <View style={styles.methodGrid}>
              {APPLICATION_METHODS.map((method) => (
                <TouchableOpacity
                  key={method.id}
                  style={[
                    styles.methodButton,
                    applicationMethod === method.id && styles.methodButtonActive
                  ]}
                  onPress={() => setApplicationMethod(method.id)}
                >
                  <Text style={styles.methodIcon}>{method.icon}</Text>
                  <Text style={[
                    styles.methodLabel,
                    applicationMethod === method.id && styles.methodLabelActive
                  ]}>
                    {method.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Dosis (opcional)</Text>
              <TextInput
                style={styles.input}
                placeholder="Ej: 1ml por ave, 1 gota"
                placeholderTextColor={colors.textMuted}
                value={dose}
                onChangeText={setDose}
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
              <Text style={styles.buttonText}>Guardar vacunación</Text>
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
  dateButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.cream, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: colors.border },
  dateIcon: { fontSize: 20, marginRight: 10 },
  dateText: { fontSize: 16, color: colors.textPrimary },
  methodGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 16 },
  methodButton: { width: '31%', padding: 10, borderRadius: 12, backgroundColor: colors.cream, alignItems: 'center', marginBottom: 10, borderWidth: 2, borderColor: 'transparent' },
  methodButtonActive: { borderColor: colors.vaccine, backgroundColor: colors.vaccine + '15' },
  methodIcon: { fontSize: 20, marginBottom: 4 },
  methodLabel: { fontSize: 10, color: colors.textMuted, textAlign: 'center' },
  methodLabelActive: { color: colors.vaccine, fontWeight: '600' },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  button: { backgroundColor: colors.vaccine, paddingVertical: 18, borderRadius: 14, alignItems: 'center' },
  buttonDisabled: { backgroundColor: colors.vaccine + '80' },
  buttonText: { color: colors.textLight, fontWeight: '700', fontSize: 17 },
});