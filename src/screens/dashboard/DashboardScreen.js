import React, { useEffect, useState, useCallback } from "react";
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  SafeAreaView,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Alert,
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
  warning: '#FF9800',
  error: '#E53935',
};

const KG_TO_LB = 2.20462;

export default function DashboardScreen({ navigation }) {
  const orgSlug = useTenantStore((s) => s.orgSlug);
  const { isPremium } = useSubscriptionStore();
  const [farmName, setFarmName] = useState(null);
  const [stats, setStats] = useState({ batches: 0, birds: 0, feedLb: 0, mortality: 0, profit: 0 });
  const [recentBatches, setRecentBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const { data: org } = await supabase
        .from("organizations")
        .select("id")
        .eq("slug", orgSlug)
        .single();

      if (!org) {
        setLoading(false);
        return;
      }

      const { data: farms } = await supabase
        .from("farms")
        .select("name")
        .eq("org_slug", orgSlug)
        .order("created_at", { ascending: true })
        .limit(1);
    
      if (farms && farms.length > 0) {
        setFarmName(farms[0].name);
      }

      const { data: batches } = await supabase
        .from("batches")
        .select("*")
        .eq("org_id", org.id)
        .eq("status", "active");

      const activeBatches = batches || [];
      let totalBirds = 0;
      let totalFeedKg = 0;
      let totalDeaths = 0;
      let totalInitial = 0;
      let totalRevenue = 0;
      let totalExpenses = 0;

      for (const batch of activeBatches) {
        totalInitial += batch.initial_quantity || 0;

        const [feedRes, mortRes, expRes, saleRes] = await Promise.all([
          supabase.from("feed_logs").select("quantity_kg").eq("batch_id", batch.id),
          supabase.from("mortality_logs").select("count").eq("batch_id", batch.id),
          supabase.from("expense_logs").select("amount").eq("batch_id", batch.id),
          supabase.from("sales_logs").select("total_amount, quantity").eq("batch_id", batch.id),
        ]);

        const batchFeed = (feedRes.data || []).reduce((sum, f) => sum + Number(f.quantity_kg || 0), 0);
        const batchDeaths = (mortRes.data || []).reduce((sum, m) => sum + Number(m.count || 0), 0);
        const batchExpenses = (expRes.data || []).reduce((sum, e) => sum + Number(e.amount || 0), 0);
        const batchRevenue = (saleRes.data || []).reduce((sum, s) => sum + Number(s.total_amount || 0), 0);
        const batchSold = (saleRes.data || []).reduce((sum, s) => sum + Number(s.quantity || 0), 0);

        totalFeedKg += batchFeed;
        totalDeaths += batchDeaths;
        totalExpenses += batchExpenses;
        totalRevenue += batchRevenue;
        totalBirds += Math.max(0, (batch.initial_quantity || 0) - batchDeaths - batchSold);
      }

      const mortalityRate = totalInitial > 0 ? (totalDeaths / totalInitial) * 100 : 0;

      setStats({
        batches: activeBatches.length,
        birds: totalBirds,
        feedLb: totalFeedKg * KG_TO_LB,
        mortality: mortalityRate,
        profit: totalRevenue - totalExpenses,
      });

      const { data: recent } = await supabase
        .from("batches")
        .select("*")
        .eq("org_id", org.id)
        .order("created_at", { ascending: false })
        .limit(5);

      setRecentBatches(recent || []);
    } catch (error) {
      console.log("Error loading dashboard:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [orgSlug]);

  useEffect(() => { loadData(); }, [loadData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
  }, [loadData]);

  function handlePremiumFeature(featureName, navigateTo) {
    if (!isPremium()) {
      Alert.alert(
        "Función Premium",
        `${featureName} está disponible en el plan Premium.`,
        [
          { text: "Cancelar", style: "cancel" },
          { text: "Ver planes", onPress: () => navigation.navigate("Subscription") },
        ]
      );
      return;
    }
    if (navigateTo) {
      navigation.navigate(navigateTo);
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.greeting}>
          {farmName ? `Bienvenido a ${farmName}` : 'Bienvenido a tu granja'}
        </Text>
        <Text style={styles.headerTitle}>Dashboard</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.metricsRow}>
          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>{stats.batches}</Text>
            <Text style={styles.metricLabel}>Lotes Activos</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>{stats.birds}</Text>
            <Text style={styles.metricLabel}>Aves Vivas</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>{stats.feedLb.toFixed(0)}</Text>
            <Text style={styles.metricLabel}>Lb Alimento</Text>
          </View>
        </View>

        <View style={styles.metricsRowCenter}>
          <View style={styles.metricCard}>
            <Text style={[styles.metricValue, { color: colors.error, textAlign: 'center' }]}>{stats.mortality.toFixed(1)}%</Text>
            <Text style={[styles.metricLabel, { textAlign: 'center' }]}>Mortalidad</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={[styles.metricValue, { color: stats.profit >= 0 ? colors.success : colors.error, textAlign: 'center' }]}>
              ${stats.profit.toFixed(0)}
            </Text>
            <Text style={[styles.metricLabel, { textAlign: 'center' }]}>Ganancia</Text>
          </View>
        </View>

        {/* Premium Banner */}
        {!isPremium() && (
          <TouchableOpacity 
            style={styles.premiumBanner}
            onPress={() => navigation.navigate("Subscription")}
          >
            <Text style={styles.premiumBannerText}>Actualiza a Premium - Lotes ilimitados, Finanzas y más</Text>
            <Text style={styles.premiumBannerArrow}>→</Text>
          </TouchableOpacity>
        )}

        <View style={styles.actionsCard}>
          <Text style={styles.sectionTitle}>Acciones Rápidas</Text>
          <View style={styles.actionsGrid}>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => navigation.navigate("BatchesTab", { screen: "CreateBatch" })}
            >
              <Text style={styles.actionIcon}>➕</Text>
              <Text style={styles.actionTitle}>Nuevo Lote</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => navigation.navigate("BatchesTab", { screen: "BatchList" })}
            >
              <Text style={styles.actionIcon}>📋</Text>
              <Text style={styles.actionTitle}>Ver Lotes</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.actionButton, { backgroundColor: '#E3F2FD' }]}
              onPress={() => handlePremiumFeature("Comparación de lotes", "BatchesTab")}
            >
              <Text style={styles.actionIcon}>📊</Text>
              <Text style={styles.actionTitle}>Comparar</Text>
              {!isPremium() && <Text style={styles.premiumBadge}>PRO</Text>}
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.actionButton, { backgroundColor: '#FFF3E0' }]}
              onPress={() => handlePremiumFeature("Reportes de Finanzas", "FinanceTab")}
            >
              <Text style={styles.actionIcon}>💰</Text>
              <Text style={styles.actionTitle}>Finanzas</Text>
              {!isPremium() && <Text style={styles.premiumBadge}>PRO</Text>}
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.recentCard}>
          <Text style={styles.sectionTitle}>Lotes Recientes</Text>
          {recentBatches.length === 0 ? (
            <Text style={styles.emptyText}>Sin lotes registrados</Text>
          ) : (
            recentBatches.map((batch) => (
              <TouchableOpacity
                key={batch.id}
                style={styles.batchItem}
                onPress={() => navigation.navigate("BatchesTab", { screen: "BatchDetails", params: { batchId: batch.id } })}
              >
                <View style={styles.batchInfo}>
                  <Text style={styles.batchIcon}>🐔</Text>
                  <View>
                    <Text style={styles.batchName}>{batch.name}</Text>
                    <Text style={styles.batchMeta}>{batch.initial_quantity} aves - {batch.status === 'active' ? 'Activo' : 'Cerrado'}</Text>
                  </View>
                </View>
                <Text style={styles.chevron}>›</Text>
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 16, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border },
  greeting: { fontSize: 14, color: colors.textMuted },
  headerTitle: { fontSize: 28, fontWeight: '700', color: colors.textPrimary },
  content: { padding: 16 },
  metricsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  metricsRowCenter: { flexDirection: 'row', justifyContent: 'center', marginBottom: 20, gap: 12 },
  metricCard: { width: '31%', backgroundColor: colors.surface, borderRadius: 14, padding: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  metricValue: { fontSize: 22, fontWeight: '700', color: colors.primary, textAlign: 'center' },
  metricLabel: { fontSize: 11, color: colors.textMuted, marginTop: 4, textAlign: 'center' },
  premiumBanner: { backgroundColor: colors.primary, borderRadius: 12, padding: 14, marginBottom: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  premiumBannerText: { color: colors.textLight, fontSize: 13, fontWeight: '600', flex: 1 },
  premiumBannerArrow: { color: colors.textLight, fontSize: 18, fontWeight: '700' },
  actionsCard: { backgroundColor: colors.surface, borderRadius: 16, padding: 16, marginBottom: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: colors.textPrimary, marginBottom: 12 },
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  actionButton: { width: '48%', backgroundColor: colors.beige, borderRadius: 12, padding: 14, alignItems: 'center', marginBottom: 8, position: 'relative' },
  actionIcon: { fontSize: 24, marginBottom: 6 },
  actionTitle: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
  premiumBadge: { position: 'absolute', top: 6, right: 6, backgroundColor: colors.warning, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, fontSize: 9, fontWeight: '700', color: colors.textLight, overflow: 'hidden' },
  recentCard: { backgroundColor: colors.surface, borderRadius: 16, padding: 16 },
  emptyText: { color: colors.textMuted, textAlign: 'center', paddingVertical: 20 },
  batchItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
  batchInfo: { flexDirection: 'row', alignItems: 'center' },
  batchIcon: { fontSize: 28, marginRight: 12 },
  batchName: { fontSize: 16, fontWeight: '600', color: colors.textPrimary },
  batchMeta: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  chevron: { fontSize: 20, color: colors.textMuted },
});