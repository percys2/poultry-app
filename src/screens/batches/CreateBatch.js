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
import { useTenantStore } from "../../store/useTenantStore";
import { useSubscriptionStore } from "../../store/useSubscriptionStore";

const colors = {
  primary: '#2D5A27',
  primaryLight: '#4A7C43',
  cream: '#FDF8F3',
  beige: '#F5E6D3',
  sand: '#E8DCC8',
  earth: '#6B4423',
  textPrimary: '#2C2C2C',
  textSecondary: '#5C5C5C',
  textMuted: '#8C8C8C',
  textLight: '#FFFFFF',
  surface: '#FFFFFF',
  border: '#E8DCC8',
  success: '#4CAF50',
  error: '#E53935',
};

export default function CreateBatch({ navigation }) {
  const orgSlug = useTenantStore((s) => s.orgSlug);
  const { isPremium } = useSubscriptionStore();

  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [chickPrice, setChickPrice] = useState("");
  const [otherCosts, setOtherCosts] = useState("");
  const [loading, setLoading] = useState(false);

  async function create() {
    if (!name.trim()) {
      return Alert.alert("Error", "Ingresa un nombre para el lote");
    }
    if (!quantity || Number(quantity) <= 0) {
      return Alert.alert("Error", "Ingresa una cantidad válida");
    }

    try {
      setLoading(true);

      const { data: org } = await supabase
        .from("organizations")
        .select("id")
        .eq("slug", orgSlug)
        .single();

      if (!org) {
        setLoading(false);
        return Alert.alert("Error", "No se encontró la organización");
      }

      // Check batch limit for free users
      if (!isPremium()) {
        const { data: activeBatches } = await supabase
          .from("batches")
          .select("id")
          .eq("org_id", org.id)
          .eq("status", "active");

        if ((activeBatches?.length || 0) >= 1) {
          setLoading(false);
          Alert.alert(
            "Límite del Plan Gratis",
            "En el plan Gratis solo puedes tener 1 lote activo.\n\nActualiza a Premium para crear lotes ilimitados.",
            [
              { text: "Cancelar", style: "cancel" },
              { text: "Ver planes", onPress: () => navigation.navigate("Subscription") },
            ]
          );
          return;
        }
      }

      const { data: newBatch, error } = await supabase.from("batches").insert({
        org_id: org.id,
        name: name.trim(),
        initial_quantity: Number(quantity),
        start_date: new Date().toISOString(),
      }).select().single();

      if (error) {
        setLoading(false);
        return Alert.alert("Error", error.message);
      }

      if (chickPrice && Number(chickPrice) > 0) {
        const totalChickCost = Number(quantity) * Number(chickPrice);
        await supabase.from("expense_logs").insert({
          batch_id: newBatch.id,
          category: 'chicks',
          amount: totalChickCost,
          description: `Compra inicial: ${quantity} pollitos a C$${chickPrice} c/u`,
        });
      }

      if (otherCosts && Number(otherCosts) > 0) {
        await supabase.from("expense_logs").insert({
          batch_id: newBatch.id,
          category: 'other',
          amount: Number(otherCosts),
          description: 'Otros costos iniciales',
        });
      }

      setLoading(false);
      Alert.alert("Lote creado", "El lote y costos iniciales se han registrado", [
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
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>← Cancelar</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Nuevo Lote</Text>
        <View style={styles.headerSpacer} />
      </View>

      <KeyboardAvoidingView 
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.iconContainer}>
            <Text style={styles.icon}>🐣</Text>
          </View>
          <Text style={styles.title}>Registrar nuevo lote</Text>
          <Text style={styles.subtitle}>
            Ingresa los datos iniciales de tu nuevo lote de aves
          </Text>

          <View style={styles.formCard}>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Nombre del lote</Text>
              <TextInput
                placeholder="Ej: Lote Enero 2025"
                placeholderTextColor={colors.textMuted}
                value={name}
                onChangeText={setName}
                style={styles.input}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Cantidad de pollitos</Text>
              <TextInput
                placeholder="Ej: 500"
                placeholderTextColor={colors.textMuted}
                value={quantity}
                onChangeText={setQuantity}
                keyboardType="numeric"
                style={styles.input}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Precio por pollito (C$)</Text>
              <TextInput
                placeholder="Ej: 34"
                placeholderTextColor={colors.textMuted}
                value={chickPrice}
                onChangeText={setChickPrice}
                keyboardType="numeric"
                style={styles.input}
              />
              <Text style={styles.inputHint}>
                Se registrará como gasto inicial automáticamente
              </Text>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Otros costos iniciales (C$)</Text>
              <TextInput
                placeholder="Ej: 5000 (opcional)"
                placeholderTextColor={colors.textMuted}
                value={otherCosts}
                onChangeText={setOtherCosts}
                keyboardType="numeric"
                style={styles.input}
              />
            </View>

            <View style={styles.infoBox}>
              <Text style={styles.infoIcon}>📅</Text>
              <Text style={styles.infoText}>
                La fecha de inicio se registrará automáticamente como hoy
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={create}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color={colors.textLight} />
            ) : (
              <Text style={styles.buttonText}>Crear lote</Text>
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
  backButton: { paddingVertical: 4 },
  backButtonText: { fontSize: 16, color: colors.primary, fontWeight: '500' },
  headerTitle: { fontSize: 18, fontWeight: '600', color: colors.textPrimary },
  headerSpacer: { width: 80 },
  keyboardView: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 40 },
  iconContainer: { alignSelf: 'center', width: 70, height: 70, borderRadius: 35, backgroundColor: colors.primaryLight + '20', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  icon: { fontSize: 36 },
  title: { fontSize: 22, fontWeight: '700', color: colors.textPrimary, textAlign: 'center', marginBottom: 6 },
  subtitle: { fontSize: 14, color: colors.textMuted, textAlign: 'center', marginBottom: 24, lineHeight: 20 },
  formCard: { backgroundColor: colors.surface, borderRadius: 20, padding: 20, marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 3 },
  inputContainer: { marginBottom: 16 },
  inputLabel: { fontSize: 14, fontWeight: '600', color: colors.textSecondary, marginBottom: 8 },
  input: { backgroundColor: colors.cream, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: colors.border, fontSize: 16, color: colors.textPrimary },
  inputHint: { fontSize: 11, color: colors.textMuted, marginTop: 4 },
  infoBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.beige, padding: 12, borderRadius: 12, borderWidth: 1, borderColor: colors.border },
  infoIcon: { fontSize: 16, marginRight: 8 },
  infoText: { flex: 1, fontSize: 12, color: colors.textSecondary, lineHeight: 16 },
  button: { backgroundColor: colors.primary, paddingVertical: 16, borderRadius: 14, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 3 },
  buttonDisabled: { backgroundColor: colors.primaryLight },
  buttonText: { color: colors.textLight, fontWeight: '700', fontSize: 16 },
});