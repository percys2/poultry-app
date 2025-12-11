import React from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
} from "react-native";

const colors = {
  primary: '#2D5A27',
  cream: '#FDF8F3',
  beige: '#F5E6D3',
  textPrimary: '#2C2C2C',
  textSecondary: '#5C5C5C',
  textMuted: '#8C8C8C',
  textLight: '#FFFFFF',
  surface: '#FFFFFF',
  border: '#E8DCC8',
};

export default function PaymentMethodScreen({ route, navigation }) {
  const { plan, userId } = route.params;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Volver</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Método de Pago</Text>
        <View style={{ width: 60 }} />
      </View>

      <View style={styles.content}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryPlan}>{plan.name}</Text>
          <Text style={styles.summaryPrice}>{plan.priceLabel}{plan.period}</Text>
        </View>

        <Text style={styles.sectionTitle}>Selecciona método de pago</Text>

        <TouchableOpacity 
          style={styles.methodCard}
          onPress={() => navigation.navigate('TransferPayment', { plan, userId })}
        >
          <Text style={styles.methodIcon}>🏦</Text>
          <View style={styles.methodInfo}>
            <Text style={styles.methodTitle}>Transferencia Bancaria</Text>
            <Text style={styles.methodSubtitle}>BAC o Lafise - Verificación en 24-48h</Text>
          </View>
          <Text style={styles.methodArrow}>›</Text>
        </TouchableOpacity>

        <View style={styles.infoCard}>
          <Text style={styles.infoText}>
            Realiza una transferencia a nuestras cuentas bancarias y sube el comprobante. 
            Tu suscripción se activará una vez verificado el pago.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border },
  backText: { fontSize: 16, color: colors.primary, fontWeight: '500' },
  headerTitle: { fontSize: 18, fontWeight: '600', color: colors.textPrimary },
  content: { padding: 20 },
  summaryCard: { backgroundColor: colors.primary + '10', borderRadius: 12, padding: 16, marginBottom: 24, alignItems: 'center', borderWidth: 1, borderColor: colors.primary + '30' },
  summaryPlan: { fontSize: 16, fontWeight: '600', color: colors.textPrimary },
  summaryPrice: { fontSize: 24, fontWeight: '700', color: colors.primary, marginTop: 4 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: colors.textPrimary, marginBottom: 16 },
  methodCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: 12, padding: 16, borderWidth: 2, borderColor: colors.primary },
  methodIcon: { fontSize: 32, marginRight: 12 },
  methodInfo: { flex: 1 },
  methodTitle: { fontSize: 16, fontWeight: '600', color: colors.textPrimary },
  methodSubtitle: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  methodArrow: { fontSize: 24, color: colors.primary },
  infoCard: { backgroundColor: colors.beige, borderRadius: 12, padding: 16, marginTop: 20 },
  infoText: { fontSize: 13, color: colors.textSecondary, lineHeight: 20 },
});