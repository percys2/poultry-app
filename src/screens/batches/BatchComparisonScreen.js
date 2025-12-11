import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { supabase } from "../../lib/supabase/client";
import { useTenantStore } from "../../store/useTenantStore";

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

const KG_TO_LB = 2.20462;

export default function BatchComparisonScreen({ navigation }) {
  const orgSlug = useTenantStore((s) => s.orgSlug);
  const [batches, setBatches] = useState([]);
  const [batchData, setBatchData] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedBatches, setSelectedBatches] = useState([]);

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

      const { data: batchesData } = await supabase
        .from("batches")
        .select("*")
        .eq("org_id", org.id)
        .order("created_at", { ascending: false })
        .limit(10);

      setBatches(batchesData || []);

      const batchMetrics = await Promise.all(
        (batchesData || []).map(async (batch) => {
          try {
            const [feedRes, weightRes, mortRes, expRes, saleRes] = await Promise.all([
              supabase.from("feed_logs").select("quantity_kg").eq("batch_id", batch.id),
              supabase.from("weight_logs").select("avg_weight_kg").eq("batch_id", batch.id).order("created_at", { ascending: false }).limit(1),
              supabase.from("mortality_logs").select("count").eq("batch_id", batch.id),
              supabase.from("expense_logs").select("amount").eq("batch_id", batch.id),
              supabase.from("sales_logs").select("total_amount, quantity").eq("batch_id", batch.id),
            ]);

            const totalFeedKg = (feedRes.data || []).reduce((sum, f) => sum + Number(f.quantity_kg || 0), 0);
            const latestWeight = weightRes.data?.[0]?.avg_weight_kg || 0;
            const totalDeaths = (mortRes.data || []).reduce((sum, m) => sum + Number(m.count || 0), 0);
            const totalExpenses = (expRes.data || []).reduce((sum, e) => sum + Number(e.amount || 0), 0);
            const totalRevenue = (saleRes.data || []).reduce((sum, s) => sum + Number(s.total_amount || 0), 0);
            const totalSold = (saleRes.data || []).reduce((sum, s) => sum + Number(s.quantity || 0), 0);

            const birdsAlive = Math.max(0, (batch.initial_quantity || 0) - totalDeaths - totalSold);
            const totalWeightKg = latestWeight * birdsAlive;
            const fcr = totalWeightKg > 0 ? totalFeedKg / totalWeightKg : 0;
            const mortalityRate = batch.initial_quantity > 0 ? (totalDeaths / batch.initial_quantity) * 100 : 0;
            const profit = totalRevenue - totalExpenses;

            const startDate = new Date(batch.start_date);
            const endDate = batch.end_date ? new Date(batch.end_date) : new Date();
            const daysActive = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));

            return {
              id: batch.id,
              data: {
                totalFeedLb: totalFeedKg * KG_TO_LB,
                avgWeightLb: latestWeight * KG_TO_LB,
                fcr,
                mortalityRate,
                birdsAlive,
                totalExpenses,
                totalRevenue,
                profit,
                daysActive,
              }
            };
          } catch (err) {
            console.log("Error loading batch metrics:", batch.id, err);
            return { id: batch.id, data: { totalFeedLb: 0, avgWeightLb: 0, fcr: 0, mortalityRate: 0, birdsAlive: 0, totalExpenses: 0, totalRevenue: 0, profit: 0, daysActive: 0 } };
          }
        })
      );

      const dataMap = {};
      batchMetrics.forEach(({ id, data }) => { dataMap[id] = data; });
      setBatchData(dataMap);
    } catch (error) {
      console.log("Error loading comparison data:", error);
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

  function toggleBatch(batchId) {
    if (selectedBatches.includes(batchId)) {
      setSelectedBatches(selectedBatches.filter(id => id !== batchId));
    } else if (selectedBatches.length < 3) {
      setSelectedBatches([...selectedBatches, batchId]);
    }
  }

  function getBestValue(metric, higherIsBetter = true) {
    const values = selectedBatches.map(id => batchData[id]?.[metric] || 0);
    if (values.length === 0) return null;
    return higherIsBetter ? Math.max(...values) : Math.min(...values);
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

  const comparisonMetrics = [
    { key: 'fcr', label: 'FCR', format: (v) => v.toFixed(2), higherIsBetter: false },
    { key: 'avgWeightLb', label: 'Peso Prom (lb)', format: (v) => v.toFixed(2), higherIsBetter: true },
    { key: 'mortalityRate', label: 'Mortalidad %', format: (v) => v.toFixed(1) + '%', higherIsBetter: false },
    { key: 'totalFeedLb', label: 'Alimento (lb)', format: (v) => v.toFixed(0), higherIsBetter: false },
    { key: 'profit', label: 'Ganancia $', format: (v) => '$' + v.toFixed(2), higherIsBetter: true },
    { key: 'daysActive', label: 'Días', format: (v) => v.toString(), higherIsBetter: false },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.navigate('BatchList')}>
          <Text style={styles.backText}>← Volver</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Comparar Lotes</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
      >
        <Text style={styles.sectionTitle}>Selecciona hasta 3 lotes ({batches.length} disponibles)</Text>
        <View style={styles.batchSelector}>
          {batches.map(batch => (
            <TouchableOpacity
              key={batch.id}
              style={[styles.batchChip, selectedBatches.includes(batch.id) && styles.batchChipActive]}
              onPress={() => toggleBatch(batch.id)}
              activeOpacity={0.7}
            >
              <Text style={[styles.batchChipText, selectedBatches.includes(batch.id) && styles.batchChipTextActive]}>
                {batch.name}
              </Text>
              {batch.status === 'completed' && <Text style={styles.completedBadge}>Cerrado</Text>}
            </TouchableOpacity>
          ))}
        </View>

        {selectedBatches.length > 0 ? (
          <View style={styles.comparisonTable}>
            <View style={styles.tableHeader}>
              <View style={styles.metricColumn}><Text style={styles.tableHeaderText}>Métrica</Text></View>
              {selectedBatches.map(id => {
                const batch = batches.find(b => b.id === id);
                return (
                  <View key={id} style={styles.valueColumn}>
                    <Text style={styles.tableHeaderText} numberOfLines={1}>{batch?.name}</Text>
                  </View>
                );
              })}
            </View>

            {comparisonMetrics.map(metric => {
              const bestValue = getBestValue(metric.key, metric.higherIsBetter);
              return (
                <View key={metric.key} style={styles.tableRow}>
                  <View style={styles.metricColumn}>
                    <Text style={styles.metricLabel}>{metric.label}</Text>
                  </View>
                  {selectedBatches.map(id => {
                    const value = batchData[id]?.[metric.key] || 0;
                    const isBest = value === bestValue && selectedBatches.length > 1;
                    return (
                      <View key={id} style={styles.valueColumn}>
                        <Text style={[styles.metricValue, isBest && styles.bestValue]}>
                          {metric.format(value)}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              );
            })}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📊</Text>
            <Text style={styles.emptyText}>Toca los lotes arriba para seleccionarlos</Text>
          </View>
        )}

        {selectedBatches.length > 1 && (
          <View style={styles.insightsCard}>
            <Text style={styles.insightsTitle}>Análisis</Text>
            {(() => {
              const bestFCRId = selectedBatches.reduce((best, id) => 
                (batchData[id]?.fcr || 999) < (batchData[best]?.fcr || 999) ? id : best
              , selectedBatches[0]);
              const bestFCRBatch = batches.find(b => b.id === bestFCRId);
              const bestProfitId = selectedBatches.reduce((best, id) =>
                (batchData[id]?.profit || 0) > (batchData[best]?.profit || 0) ? id : best
              , selectedBatches[0]);
              const bestProfitBatch = batches.find(b => b.id === bestProfitId);
              
              const bestFCR = batchData[bestFCRId]?.fcr;
              const bestProfit = batchData[bestProfitId]?.profit;
              const fcrText = typeof bestFCR === 'number' && isFinite(bestFCR) ? bestFCR.toFixed(2) : '--';
              const profitText = typeof bestProfit === 'number' && isFinite(bestProfit) ? bestProfit.toFixed(2) : '--';
              
              return (
                <>
                  <Text style={styles.insightText}>
                    Mejor FCR: <Text style={styles.insightHighlight}>{bestFCRBatch?.name || '--'}</Text> ({fcrText})
                  </Text>
                  <Text style={styles.insightText}>
                    Mayor ganancia: <Text style={styles.insightHighlight}>{bestProfitBatch?.name || '--'}</Text> (${profitText})
                  </Text>
                </>
              );
            })()}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, color: colors.textMuted },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border },
  backText: { fontSize: 16, color: colors.primary, fontWeight: '500' },
  headerTitle: { fontSize: 18, fontWeight: '600', color: colors.textPrimary },
  content: { padding: 20 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: colors.textPrimary, marginBottom: 12 },
  batchSelector: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 20 },
  batchChip: { backgroundColor: colors.beige, paddingHorizontal: 16, paddingVertical: 12, borderRadius: 20, marginRight: 8, marginBottom: 8, flexDirection: 'row', alignItems: 'center' },
  batchChipActive: { backgroundColor: colors.primary },
  batchChipText: { color: colors.textSecondary, fontWeight: '600', fontSize: 14 },
  batchChipTextActive: { color: colors.textLight },
  completedBadge: { fontSize: 10, color: colors.textMuted, marginLeft: 6, backgroundColor: colors.sand, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  comparisonTable: { backgroundColor: colors.surface, borderRadius: 16, overflow: 'hidden', marginBottom: 20 },
  tableHeader: { flexDirection: 'row', backgroundColor: colors.primary, padding: 12 },
  tableHeaderText: { color: colors.textLight, fontWeight: '600', fontSize: 12, textAlign: 'center' },
  tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: colors.border, padding: 12 },
  metricColumn: { flex: 1.2 },
  valueColumn: { flex: 1, alignItems: 'center' },
  metricLabel: { color: colors.textSecondary, fontSize: 13 },
  metricValue: { color: colors.textPrimary, fontWeight: '500', fontSize: 14 },
  bestValue: { color: colors.success, fontWeight: '700' },
  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { color: colors.textMuted, fontSize: 16, textAlign: 'center' },
  insightsCard: { backgroundColor: '#E8F5E9', borderRadius: 16, padding: 16 },
  insightsTitle: { fontSize: 16, fontWeight: '600', color: colors.primary, marginBottom: 12 },
  insightText: { color: colors.textSecondary, marginBottom: 8, fontSize: 14 },
  insightHighlight: { color: colors.primary, fontWeight: '600' },
});