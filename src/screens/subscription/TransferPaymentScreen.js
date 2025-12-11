import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Image,
} from "react-native";
import * as Clipboard from 'expo-clipboard';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { decode } from 'base64-arraybuffer';
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
};

const BANK_ACCOUNTS = [
  {
    bank: 'BAC',
    accountName: 'Poultry App',
    accountNumber: '368871133',
    accountType: 'Cuenta Corriente',
    currency: 'Córdobas (NIO)',
  },
  {
    bank: 'Lafise',
    accountName: 'Poultry App',
    accountNumber: '133099051',
    accountType: 'Cuenta Corriente',
    currency: 'Córdobas (NIO)',
  },
];

export default function TransferPaymentScreen({ route, navigation }) {
  const { plan, userId } = route.params;
  const { updateSubscription, logPayment, fetchSubscription } = useSubscriptionStore();
  
  const [reference, setReference] = useState('');
  const [proofImage, setProofImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [copiedAccount, setCopiedAccount] = useState(null);

  async function copyToClipboard(text, accountIndex) {
    try {
      await Clipboard.setStringAsync(text);
      setCopiedAccount(accountIndex);
      setTimeout(() => setCopiedAccount(null), 2000);
    } catch (error) {
      console.log('Copy error:', error);
    }
  }

  async function pickImage() {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permiso requerido', 'Necesitamos acceso a tu galería para subir el comprobante.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setProofImage(result.assets[0].uri);
      }
    } catch (error) {
      console.log('Image picker error:', error);
      Alert.alert('Error', 'No se pudo seleccionar la imagen');
    }
  }

  async function takePhoto() {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permiso requerido', 'Necesitamos acceso a tu cámara para tomar foto del comprobante.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setProofImage(result.assets[0].uri);
      }
    } catch (error) {
      console.log('Camera error:', error);
      Alert.alert('Error', 'No se pudo tomar la foto');
    }
  }

async function uploadProofImage() {
  if (!proofImage) return null;

  try {
    const fileName = `transfer_proof_${userId}_${Date.now()}.jpg`;

    // Read file as base64
    const base64 = await FileSystem.readAsStringAsync(proofImage, {
      encoding: 'base64',
    });

    // Convert base64 to ArrayBuffer
    const arrayBuffer = decode(base64);

    console.log('Uploading image, size:', arrayBuffer.byteLength);

    // Upload to Supabase
    const { data, error } = await supabase.storage
      .from('payment-proofs')
      .upload(fileName, arrayBuffer, {
        contentType: 'image/jpeg',
        upsert: false,
      });

    if (error) {
      console.log('Supabase upload error:', error);
      throw error;
    }

    const { data: urlData } = supabase.storage
      .from('payment-proofs')
      .getPublicUrl(fileName);

    return urlData.publicUrl;
  } catch (error) {
    console.log('Upload error:', error);
    return null;
  }
}

  async function handleSubmit() {
    if (!reference.trim()) {
      Alert.alert('Error', 'Ingresa el número de referencia de la transferencia');
      return;
    }

    setLoading(true);

    try {
      let proofUrl = null;
      if (proofImage) {
        proofUrl = await uploadProofImage();
        if (!proofUrl) {
          Alert.alert('Error', 'No se pudo subir el comprobante. Intenta de nuevo.');
          setLoading(false);
          return;
        }
      }

      await logPayment({
        user_id: userId,
        amount: plan.price,
        currency: 'NIO',
        payment_method: 'transfer',
        status: 'pending',
        plan_id: plan.id,
        reference: reference.trim(),
        proof_url: proofUrl,
        created_at: new Date().toISOString(),
      });

      await updateSubscription(userId, {
        plan: 'premium',
        status: 'pending',
        payment_method: 'transfer',
        updated_at: new Date().toISOString(),
      });

      await fetchSubscription(userId);

      Alert.alert(
        'Comprobante Enviado',
        'Tu pago está siendo verificado. Recibirás una notificación cuando se active tu suscripción (24-48 horas).',
        [{ text: 'OK', onPress: () => navigation.navigate('Subscription') }]
      );
    } catch (error) {
      console.log('Submit error:', error);
      Alert.alert('Error', 'No se pudo enviar el comprobante. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Volver</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Transferencia</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryPlan}>{plan.name}</Text>
          <Text style={styles.summaryPrice}>{plan.priceLabel}{plan.period}</Text>
        </View>

        <View style={styles.instructionsCard}>
          <Text style={styles.instructionsTitle}>Instrucciones</Text>
          <Text style={styles.instructionStep}>1. Realiza una transferencia por {plan.priceLabel} a una de las cuentas abajo</Text>
          <Text style={styles.instructionStep}>2. Guarda el número de referencia</Text>
          <Text style={styles.instructionStep}>3. Sube el comprobante o ingresa la referencia</Text>
          <Text style={styles.instructionStep}>4. Verificaremos tu pago en 24-48 horas</Text>
        </View>

        <Text style={styles.sectionTitle}>Cuentas Bancarias</Text>
        {BANK_ACCOUNTS.map((account, index) => (
          <View key={index} style={styles.bankCard}>
            <Text style={styles.bankName}>{account.bank}</Text>
            <View style={styles.bankRow}>
              <Text style={styles.bankLabel}>Titular:</Text>
              <Text style={styles.bankValue}>{account.accountName}</Text>
            </View>
            <View style={styles.bankRow}>
              <Text style={styles.bankLabel}>Cuenta:</Text>
              <Text style={styles.bankValue}>{account.accountNumber}</Text>
              <TouchableOpacity 
                style={styles.copyBtn}
                onPress={() => copyToClipboard(account.accountNumber, index)}
              >
                <Text style={styles.copyBtnText}>
                  {copiedAccount === index ? '✓ Copiado' : 'Copiar'}
                </Text>
              </TouchableOpacity>
            </View>
            <View style={styles.bankRow}>
              <Text style={styles.bankLabel}>Tipo:</Text>
              <Text style={styles.bankValue}>{account.accountType}</Text>
            </View>
            <View style={styles.bankRow}>
              <Text style={styles.bankLabel}>Moneda:</Text>
              <Text style={styles.bankValue}>{account.currency}</Text>
            </View>
          </View>
        ))}

        <Text style={styles.sectionTitle}>Datos de la Transferencia</Text>
        <View style={styles.formCard}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Número de referencia *</Text>
            <TextInput
              style={styles.input}
              value={reference}
              onChangeText={setReference}
              placeholder="Ej: 123456789"
              placeholderTextColor={colors.textMuted}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Comprobante (opcional)</Text>
            {proofImage ? (
              <View style={styles.proofContainer}>
                <Image source={{ uri: proofImage }} style={styles.proofImage} />
                <TouchableOpacity 
                  style={styles.removeProofBtn}
                  onPress={() => setProofImage(null)}
                >
                  <Text style={styles.removeProofText}>✕</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.uploadButtons}>
                <TouchableOpacity style={styles.uploadBtn} onPress={pickImage}>
                  <Text style={styles.uploadBtnEmoji}>📁</Text>
                  <Text style={styles.uploadBtnText}>Galería</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.uploadBtn} onPress={takePhoto}>
                  <Text style={styles.uploadBtnEmoji}>📷</Text>
                  <Text style={styles.uploadBtnText}>Cámara</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>

        <TouchableOpacity 
          style={[styles.submitButton, loading && styles.submitButtonDisabled]} 
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={colors.textLight} />
          ) : (
            <Text style={styles.submitButtonText}>Enviar Comprobante</Text>
          )}
        </TouchableOpacity>

        <Text style={styles.noteText}>
          * Tu suscripción se activará una vez verificado el pago
        </Text>
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
  summaryCard: { backgroundColor: colors.success + '10', borderRadius: 12, padding: 16, marginBottom: 16, alignItems: 'center', borderWidth: 1, borderColor: colors.success + '30' },
  summaryPlan: { fontSize: 16, fontWeight: '600', color: colors.textPrimary },
  summaryPrice: { fontSize: 20, fontWeight: '700', color: colors.success, marginTop: 4 },
  instructionsCard: { backgroundColor: colors.beige, borderRadius: 12, padding: 16, marginBottom: 20 },
  instructionsTitle: { fontSize: 14, fontWeight: '600', color: colors.textPrimary, marginBottom: 8 },
  instructionStep: { fontSize: 13, color: colors.textSecondary, marginBottom: 4, lineHeight: 18 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: colors.textPrimary, marginBottom: 12 },
  bankCard: { backgroundColor: colors.surface, borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: colors.border },
  bankName: { fontSize: 16, fontWeight: '700', color: colors.primary, marginBottom: 12 },
  bankRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  bankLabel: { fontSize: 13, color: colors.textMuted, width: 60 },
  bankValue: { fontSize: 14, color: colors.textPrimary, fontWeight: '500', flex: 1 },
  copyBtn: { backgroundColor: colors.primary + '15', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  copyBtnText: { fontSize: 12, color: colors.primary, fontWeight: '600' },
  formCard: { backgroundColor: colors.surface, borderRadius: 12, padding: 16, marginBottom: 20 },
  inputGroup: { marginBottom: 16 },
  inputLabel: { fontSize: 14, fontWeight: '500', color: colors.textSecondary, marginBottom: 8 },
  input: { backgroundColor: colors.cream, borderWidth: 1, borderColor: colors.border, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16, color: colors.textPrimary },
  uploadButtons: { flexDirection: 'row', gap: 12 },
  uploadBtn: { flex: 1, backgroundColor: colors.beige, borderRadius: 10, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: colors.border, borderStyle: 'dashed' },
  uploadBtnEmoji: { fontSize: 24, marginBottom: 4 },
  uploadBtnText: { fontSize: 13, color: colors.textSecondary, fontWeight: '500' },
  proofContainer: { position: 'relative' },
  proofImage: { width: '100%', height: 200, borderRadius: 10 },
  removeProofBtn: { position: 'absolute', top: 8, right: 8, backgroundColor: colors.error, width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  removeProofText: { color: colors.textLight, fontSize: 14, fontWeight: '700' },
  submitButton: { backgroundColor: colors.primary, paddingVertical: 16, borderRadius: 12, alignItems: 'center', marginBottom: 12 },
  submitButtonDisabled: { opacity: 0.7 },
  submitButtonText: { color: colors.textLight, fontSize: 18, fontWeight: '700' },
  noteText: { fontSize: 12, color: colors.textMuted, textAlign: 'center' },
});
