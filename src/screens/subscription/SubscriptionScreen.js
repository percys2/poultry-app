import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
} from "react-native";
import { supabase } from "../../lib/supabase/client";
import { useSubscriptionStore } from "../../store/useSubscriptionStore";

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
  warning: '#FF9800',
  error: '#E53935',
  gold: '#FFD700',
};

export default function SubscriptionScreen({ navigation }) {
  const { subscription, isPremium, getDaysRemaining } = useSubscriptionStore();
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setUserId(user.id);
    }).catch(e => console.log('Error getting user:', e));
  }, []);

  const isCurrentPremium = isPremium();
  const daysRemaining = getDaysRemaining();

  function handleSubscribe() {
    if (!userId) {
      Alert.alert('Error', 'No se pudo obtener tu información de usuario. Intenta de nuevo.');
      return;
    }

    navigation.navigate('PaymentMethod', { 
      plan: {
        id: 'premium_monthly',
        name: 'Premium Mensual',
        price: 900,
        priceLabel: 'C$900',
        period: '/mes',
      },
      userId,
    });
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Volver</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Suscripción</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Current Status */}
        <View style={[styles.statusCard, isCurrentPremium && styles.statusCardPremium]}>
          <Text style={styles.statusLabel}>Tu plan actual</Text>
          <Text style={[styles.statusPlan, isCurrentPremium && styles.statusPlanPremium]}>
            {isCurrentPremium ? 'Premium' : 'Gratis'}
          </Text>
          {isCurrentPremium && daysRemaining > 0 && (
            <Text style={styles.statusExpiry}>
              {daysRemaining} días restantes
            </Text>
          )}
          {subscription?.status === 'pending' && (
            <View style={styles.pendingBadge}>
              <Text style={styles.pendingText}>Pago pendiente de verificación</Text>
            </View>
          )}
        </View>

        {/* Free Plan Limitations */}
        {!isCurrentPremium && (
          <View style={styles.limitationsCard}>
            <Text style={styles.limitationsTitle}>Plan Gratis - Limitaciones</Text>
            <View style={styles.limitationRow}>
              <Text style={styles.limitationX}>✗</Text>
              <Text style={styles.limitationText}>Solo 1 lote activo</Text>
            </View>
            <View style={styles.limitationRow}>
              <Text style={styles.limitationX}>✗</Text>
              <Text style={styles.limitationText}>Sin comparación de lotes</Text>
            </View>
            <View style={styles.limitationRow}>
              <Text style={styles.limitationX}>✗</Text>
              <Text style={styles.limitationText}>Sin reportes de finanzas</Text>
            </View>
            <View style={styles.limitationRow}>
              <Text style={styles.limitationX}>✗</Text>
              <Text style={styles.limitationText}>Sin calculadora de ganancia</Text>
            </View>
          </View>
        )}

        {/* Premium Plan */}
        <View style={styles.planCard}>
          <View style={styles.popularBadge}>
            <Text style={styles.popularText}>Desbloquea Todo</Text>
          </View>

          <View style={styles.planHeader}>
            <Text style={styles.planName}>Premium</Text>
            <View style={styles.priceContainer}>
              <Text style={styles.planPrice}>C$900</Text>
              <Text style={styles.planPeriod}>/mes</Text>
            </View>
          </View>

          <View style={styles.featuresContainer}>
            <View style={styles.featureRow}>
              <Text style={styles.featureCheck}>✓</Text>
              <Text style={styles.featureText}>Lotes ilimitados</Text>
            </View>
            <View style={styles.featureRow}>
              <Text style={styles.featureCheck}>✓</Text>
              <Text style={styles.featureText}>Comparación de lotes</Text>
            </View>
            <View style={styles.featureRow}>
              <Text style={styles.featureCheck}>✓</Text>
              <Text style={styles.featureText}>Reportes de finanzas completos</Text>
            </View>
            <View style={styles.featureRow}>
              <Text style={styles.featureCheck}>✓</Text>
              <Text style={styles.featureText}>Calculadora de ganancia</Text>
            </View>
            <View style={styles.featureRow}>
              <Text style={styles.featureCheck}>✓</Text>
              <Text style={styles.featureText}>Gráficos y estadísticas</Text>
            </View>
            <View style={styles.featureRow}>
              <Text style={styles.featureCheck}>✓</Text>
              <Text style={styles.featureText}>Soporte prioritario</Text>
            </View>
          </View>

          {isCurrentPremium ? (
            <View style={styles.currentPlanBadge}>
              <Text style={styles.currentPlanText}>Plan Actual</Text>
            </View>
          ) : (
            <TouchableOpacity style={styles.subscribeButton} onPress={handleSubscribe}>
              <Text style={styles.subscribeButtonText}>Suscribirse - C$900/mes</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>Métodos de pago</Text>
          <Text style={styles.infoText}>- Transferencia bancaria (BAC, Lafise)</Text>
          <Text style={styles.infoText}>- Los pagos se verifican en 24-48 horas</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border },
  backText: { fontSize: 16, color: colors.primary, fontWeight: '500' },
  headerTitle: { fontSize: 18, fontWeight: '600', color: colors.textPrimary },
  content: { padding: 20, paddingBottom: 40 },
  statusCard: { backgroundColor: colors.surface, borderRadius: 16, padding: 20, marginBottom: 20, alignItems: 'center', borderWidth: 2, borderColor: colors.border },
  statusCardPremium: { borderColor: colors.gold, backgroundColor: '#FFFDF5' },
  statusLabel: { fontSize: 14, color: colors.textMuted, marginBottom: 4 },
  statusPlan: { fontSize: 28, fontWeight: '700', color: colors.textPrimary },
  statusPlanPremium: { color: colors.primary },
  statusExpiry: { fontSize: 14, color: colors.success, marginTop: 4 },
  pendingBadge: { backgroundColor: colors.warning + '20', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, marginTop: 8 },
  pendingText: { color: colors.warning, fontSize: 12, fontWeight: '600' },
  limitationsCard: { backgroundColor: colors.error + '10', borderRadius: 16, padding: 16, marginBottom: 20, borderWidth: 1, borderColor: colors.error + '30' },
  limitationsTitle: { fontSize: 16, fontWeight: '600', color: colors.error, marginBottom: 12 },
  limitationRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  limitationX: { color: colors.error, fontSize: 16, fontWeight: '600', marginRight: 8, width: 20 },
  limitationText: { color: colors.textSecondary, fontSize: 14 },
  planCard: { backgroundColor: colors.surface, borderRadius: 16, padding: 20, marginBottom: 20, borderWidth: 2, borderColor: colors.primary },
  popularBadge: { position: 'absolute', top: -12, alignSelf: 'center', backgroundColor: colors.primary, paddingHorizontal: 16, paddingVertical: 6, borderRadius: 12 },
  popularText: { color: colors.textLight, fontSize: 12, fontWeight: '700' },
  planHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, marginTop: 8 },
  planName: { fontSize: 24, fontWeight: '700', color: colors.textPrimary },
  priceContainer: { flexDirection: 'row', alignItems: 'baseline' },
  planPrice: { fontSize: 32, fontWeight: '700', color: colors.primary },
  planPeriod: { fontSize: 16, color: colors.textMuted, marginLeft: 2 },
  featuresContainer: { marginBottom: 20 },
  featureRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  featureCheck: { color: colors.success, fontSize: 18, fontWeight: '600', marginRight: 10, width: 24 },
  featureText: { color: colors.textPrimary, fontSize: 15, flex: 1 },
  currentPlanBadge: { backgroundColor: colors.success + '20', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  currentPlanText: { color: colors.success, fontWeight: '700', fontSize: 16 },
  subscribeButton: { backgroundColor: colors.primary, paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
  subscribeButtonText: { color: colors.textLight, fontWeight: '700', fontSize: 18 },
  infoCard: { backgroundColor: colors.beige, borderRadius: 16, padding: 16 },
  infoTitle: { fontSize: 14, fontWeight: '600', color: colors.textPrimary, marginBottom: 8 },
  infoText: { fontSize: 13, color: colors.textSecondary, marginBottom: 4 },
});