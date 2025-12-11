import React, { useEffect, useState, useCallback } from "react";
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  ScrollView,
  SafeAreaView,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { supabase } from "../../lib/supabase/client";
import { useTenantStore } from "../../store/useTenantStore";

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
};

export default function BatchList({ navigation }) {
  const orgSlug = useTenantStore((s) => s.orgSlug);
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function load() {
    try {
      const { data: org } = await supabase
        .from("organizations")
        .select("id")
        .eq("slug", orgSlug)
        .single();

      if (!org) {
        setBatches([]);
        return;
      }

      const { data } = await supabase
        .from("batches")
        .select("*")
        .eq("org_id", org.id)
        .order("created_at", { ascending: false });

      setBatches(data || []);
    } catch (error) {
      console.log("Error loading batches:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    load();
  }, []);

  useEffect(() => {
    load();
    const unsubscribe = navigation.addListener('focus', () => {
      load();
    });
    return unsubscribe;
  }, [navigation]);

  function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric' 
    });
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Cargando lotes...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.navigate('DashboardTab')}
        >
          <Text style={styles.backButtonText}>← Inicio</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Mis Lotes</Text>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => navigation.navigate("CreateBatch")}
        >
          <Text style={styles.addButtonText}>+ Nuevo</Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        {batches.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🐣</Text>
            <Text style={styles.emptyTitle}>Sin lotes aún</Text>
            <Text style={styles.emptyText}>
              Crea tu primer lote para comenzar a gestionar tus aves
            </Text>
            <TouchableOpacity 
              style={styles.emptyButton}
              onPress={() => navigation.navigate("CreateBatch")}
            >
              <Text style={styles.emptyButtonText}>Crear primer lote</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <Text style={styles.countText}>{batches.length} lote{batches.length !== 1 ? 's' : ''}</Text>
            {batches.map((batch) => {
              const isCompleted = batch.status === 'completed';
              return (
                <TouchableOpacity
                  key={batch.id}
                  style={[
                    styles.batchCard,
                    isCompleted && styles.batchCardCompleted
                  ]}
                  onPress={() => navigation.navigate("BatchDetails", { batchId: batch.id })}
                  activeOpacity={0.7}
                >
                  <View style={[
                    styles.batchIconContainer,
                    isCompleted && styles.batchIconContainerCompleted
                  ]}>
                    <Text style={styles.batchIcon}>{isCompleted ? '✅' : '🐔'}</Text>
                  </View>
                  <View style={styles.batchInfo}>
                    <View style={styles.batchNameRow}>
                      <Text style={[
                        styles.batchName,
                        isCompleted && styles.batchNameCompleted
                      ]}>{batch.name}</Text>
                      {isCompleted && (
                        <View style={styles.completedBadge}>
                          <Text style={styles.completedBadgeText}>CERRADO</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.batchDetail}>
                      {batch.initial_quantity} aves - {formatDate(batch.start_date)}
                      {isCompleted && batch.end_date && ` → ${formatDate(batch.end_date)}`}
                    </Text>
                  </View>
                  <Text style={styles.chevron}>›</Text>
                </TouchableOpacity>
              );
            })}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, fontSize: 16, color: colors.textMuted },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border },
  backButton: { paddingVertical: 4 },
  backButtonText: { fontSize: 16, color: colors.primary, fontWeight: '500' },
  title: { fontSize: 20, fontWeight: '700', color: colors.textPrimary },
  addButton: { backgroundColor: colors.primary, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  addButtonText: { color: colors.textLight, fontWeight: '600', fontSize: 14 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 32 },
  countText: { fontSize: 14, color: colors.textMuted, marginBottom: 16 },
  batchCard: { backgroundColor: colors.surface, borderRadius: 16, padding: 16, marginBottom: 12, flexDirection: 'row', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  batchIconContainer: { width: 50, height: 50, borderRadius: 12, backgroundColor: colors.primaryLight + '15', justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  batchIcon: { fontSize: 24 },
  batchInfo: { flex: 1 },
  batchNameRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  batchName: { fontSize: 17, fontWeight: '600', color: colors.textPrimary },
  batchNameCompleted: { color: colors.textMuted },
  batchDetail: { fontSize: 14, color: colors.textMuted },
  batchCardCompleted: { backgroundColor: '#F5F5F5', borderWidth: 1, borderColor: '#E0E0E0' },
  batchIconContainerCompleted: { backgroundColor: '#E8F5E9' },
  completedBadge: { backgroundColor: colors.success, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10, marginLeft: 8 },
  completedBadgeText: { color: colors.textLight, fontSize: 10, fontWeight: '700' },
  chevron: { fontSize: 24, color: colors.textMuted, fontWeight: '300' },
  emptyState: { alignItems: 'center', paddingVertical: 60, paddingHorizontal: 40 },
  emptyIcon: { fontSize: 64, marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: '600', color: colors.textPrimary, marginBottom: 8 },
  emptyText: { fontSize: 15, color: colors.textMuted, textAlign: 'center', lineHeight: 22, marginBottom: 24 },
  emptyButton: { backgroundColor: colors.primary, paddingHorizontal: 24, paddingVertical: 14, borderRadius: 12 },
  emptyButtonText: { color: colors.textLight, fontWeight: '600', fontSize: 16 },
});