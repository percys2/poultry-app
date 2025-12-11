import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { supabase } from "../../lib/supabase/client";
import { useTenantStore } from "../../store/useTenantStore";
import { BarChart } from "react-native-chart-kit";

const screenWidth = Dimensions.get("window").width;

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
  error: '#E53935',
  warning: '#FF9800',
  blue: '#2196F3',
  purple: '#9C27B0',
  orange: '#FF9800',
  teal: '#009688',
};

const KG_TO_LB = 2.20462;

const PERIOD_FILTERS = [
  { key: 'month', label: 'Este Mes' },
  { key: '3months', label: '3 Meses' },
  { key: 'year', label: 'Este Año' },
  { key: 'all', label: 'Todo' },
];

const EXPENSE_CATEGORIES = {
  chicks: { label: 'Pollitos', color: colors.warning },
  feed: { label: 'Alimento', color: colors.primary },
  medicine: { label: 'Medicina', color: colors.error },
  labor: { label: 'Mano de Obra', color: colors.blue },
  utilities: { label: 'Servicios', color: colors.purple },
  other: { label: 'Otros', color: colors.textMuted },
};

export default function FinanceScreen() {
  const orgSlug = useTenantStore((s) => s.orgSlug);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('all');
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalExpenses: 0,
    profit: 0,
    margin: 0,
    roi: 0,
    batchStats: [],
    expensesByCategory: {},
  });

  function getDateFilter(period) {
    const now = new Date();
    switch (period) {
      case 'month':
        return new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      case '3months':
        return new Date(now.getFullYear(), now.getMonth() - 2, 1).toISOString();
      case 'year':
        return new Date(now.getFullYear(), 0, 1).toISOString();
      default:
        return null;
    }
  }

  async function loadFinanceData() {
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

      const { data: batches } = await supabase
        .from("batches")
        .select("id, name, initial_quantity, start_date")
        .eq("org_id", org.id);

      if (!batches || batches.length === 0) {
        setStats({ totalRevenue: 0, totalExpenses: 0, profit: 0, margin: 0, roi: 0, batchStats: [], expensesByCategory: {} });
        setLoading(false);
        setRefreshing(false);
        return;
      }

      const batchIds = batches.map(b => b.id);
      const dateFilter = getDateFilter(selectedPeriod);

      let expensesQuery = supabase
        .from("expense_logs")
        .select("batch_id, amount, category, created_at")
        .in("batch_id", batchIds);
      
      let salesQuery = supabase
        .from("sales_logs")
        .select("batch_id, total_revenue, total_amount, quantity_birds, quantity, total_weight_kg, created_at")
        .in("batch_id", batchIds);

      if (dateFilter) {
        expensesQuery = expensesQuery.gte("created_at", dateFilter);
        salesQuery = salesQuery.gte("created_at", dateFilter);
      }

      let feedQuery = supabase
        .from("feed_logs")
        .select("batch_id, cost, quantity_kg, created_at")
        .in("batch_id", batchIds);

      if (dateFilter) {
        feedQuery = feedQuery.gte("created_at", dateFilter);
      }

      const [expensesRes, salesRes, mortalityRes, feedRes] = await Promise.all([
        expensesQuery,
        salesQuery,
        supabase.from("mortality_logs").select("batch_id, count").in("batch_id", batchIds),
        feedQuery,
      ]);

      const expenses = expensesRes.data || [];
      const sales = salesRes.data || [];
      const mortality = mortalityRes.data || [];
      const feedLogs = feedRes.data || [];

      let totalRevenue = 0;
      let totalExpenses = 0;
      const batchStats = [];
      const expensesByCategory = {};

      for (const category of Object.keys(EXPENSE_CATEGORIES)) {
        expensesByCategory[category] = 0;
      }

      for (const batch of batches) {
        const batchExpenses = expenses.filter(e => e.batch_id === batch.id);
        const batchSales = sales.filter(s => s.batch_id === batch.id);
        const batchMortality = mortality.filter(m => m.batch_id === batch.id);
        const batchFeedLogs = feedLogs.filter(f => f.batch_id === batch.id);

        const batchFeedCostFromLogs = batchFeedLogs.reduce((sum, f) => sum + Number(f.cost || 0), 0);
        const batchFeedCostFromExpenses = batchExpenses.filter(e => e.category === 'feed').reduce((sum, e) => sum + Number(e.amount || 0), 0);
        const batchFeedCost = batchFeedCostFromLogs + batchFeedCostFromExpenses;
        
        const batchExpensesFromLogs = batchExpenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
        const batchTotalExpenses = batchExpensesFromLogs + batchFeedCostFromLogs;
        const batchChickCost = batchExpenses.filter(e => e.category === 'chicks').reduce((sum, e) => sum + Number(e.amount || 0), 0);
        const batchOtherCost = batchTotalExpenses - batchChickCost - batchFeedCost;
        const batchTotalRevenue = batchSales.reduce((sum, s) => sum + Number(s.total_revenue || s.total_amount || 0), 0);
        const batchTotalMortality = batchMortality.reduce((sum, m) => sum + Number(m.count || 0), 0);
        const batchTotalSold = batchSales.reduce((sum, s) => sum + Number(s.quantity_birds || s.quantity || 0), 0);
        const batchTotalWeightKg = batchSales.reduce((sum, s) => sum + Number(s.total_weight_kg || 0), 0);
        const batchTotalWeightLb = batchTotalWeightKg * KG_TO_LB;

        for (const exp of batchExpenses) {
          const cat = exp.category || 'other';
          expensesByCategory[cat] = (expensesByCategory[cat] || 0) + Number(exp.amount || 0);
        }

        if (batchFeedCostFromLogs > 0) {
          expensesByCategory['feed'] = (expensesByCategory['feed'] || 0) + batchFeedCostFromLogs;
        }

        const birdsProduced = Math.max(0, (batch.initial_quantity || 0) - batchTotalMortality);
        const costPerBird = birdsProduced > 0 ? batchTotalExpenses / birdsProduced : 0;
        const costPerLb = batchTotalWeightLb > 0 ? batchTotalExpenses / batchTotalWeightLb : 0;
        const batchProfit = batchTotalRevenue - batchTotalExpenses;
        const batchMargin = batchTotalRevenue > 0 ? (batchProfit / batchTotalRevenue) * 100 : 0;
        const batchROI = batchTotalExpenses > 0 ? (batchProfit / batchTotalExpenses) * 100 : 0;

        totalRevenue += batchTotalRevenue;
        totalExpenses += batchTotalExpenses;

        if (batchTotalRevenue > 0 || batchTotalExpenses > 0) {
          batchStats.push({
            id: batch.id,
            name: batch.name,
            revenue: batchTotalRevenue,
            expenses: batchTotalExpenses,
            chickCost: batchChickCost,
            feedCost: batchFeedCost,
            otherCost: batchOtherCost,
            profit: batchProfit,
            margin: batchMargin,
            roi: batchROI,
            costPerBird,
            costPerLb,
            birdsSold: batchTotalSold,
            weightLb: batchTotalWeightLb,
          });
        }
      }

      const profit = totalRevenue - totalExpenses;
      const margin = totalRevenue > 0 ? (profit / totalRevenue) * 100 : 0;
      const roi = totalExpenses > 0 ? (profit / totalExpenses) * 100 : 0;

      setStats({
        totalRevenue,
        totalExpenses,
        profit,
        margin,
        roi,
        batchStats: batchStats.sort((a, b) => b.profit - a.profit),
        expensesByCategory,
      });
    } catch (error) {
      console.log("Error loading finance data:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadFinanceData();
  }, [selectedPeriod]);

  useEffect(() => {
    loadFinanceData();
  }, [selectedPeriod]);

  function formatCurrency(value) {
    const num = Number(value) || 0;
    return "C$" + num.toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  }

  function formatPercent(value) {
    const num = Number(value) || 0;
    return num.toFixed(1) + "%";
  }

  function getChartData() {
    const topBatches = stats.batchStats.slice(0, 5);
    if (topBatches.length === 0) return null;

    return {
      labels: topBatches.map(b => b.name.length > 8 ? b.name.substring(0, 8) + '...' : b.name),
      datasets: [
        {
          data: topBatches.map(b => b.revenue),
          color: () => colors.success,
        },
        {
          data: topBatches.map(b => b.expenses),
          color: () => colors.error,
        },
      ],
      legend: ['Ingresos', 'Gastos'],
    };
  }

  function getTotalExpensesByCategory() {
    const total = Object.values(stats.expensesByCategory).reduce((sum, val) => sum + val, 0);
    if (total === 0) return [];

    return Object.entries(stats.expensesByCategory)
      .filter(([_, value]) => value > 0)
      .map(([category, value]) => ({
        category,
        label: EXPENSE_CATEGORIES[category]?.label || category,
        color: EXPENSE_CATEGORIES[category]?.color || colors.textMuted,
        value,
        percent: (value / total) * 100,
      }))
      .sort((a, b) => b.value - a.value);
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Cargando finanzas...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const chartData = getChartData();
  const expenseBreakdown = getTotalExpensesByCategory();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Finanzas</Text>
        <Text style={styles.headerSubtitle}>Resumen financiero</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
        }
      >
        <View style={styles.periodFilter}>
          {PERIOD_FILTERS.map((filter) => (
            <TouchableOpacity
              key={filter.key}
              style={[styles.periodButton, selectedPeriod === filter.key && styles.periodButtonActive]}
              onPress={() => setSelectedPeriod(filter.key)}
            >
              <Text style={[styles.periodButtonText, selectedPeriod === filter.key && styles.periodButtonTextActive]}>
                {filter.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Ingresos</Text>
              <Text style={[styles.summaryValue, { color: colors.success }]}>
                {formatCurrency(stats.totalRevenue)}
              </Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Gastos</Text>
              <Text style={[styles.summaryValue, { color: colors.error }]}>
                {formatCurrency(stats.totalExpenses)}
              </Text>
            </View>
          </View>
          <View style={styles.profitContainer}>
            <Text style={styles.profitLabel}>Ganancia Neta</Text>
            <Text style={[styles.profitValue, { color: stats.profit >= 0 ? colors.success : colors.error }]}>
              {formatCurrency(stats.profit)}
            </Text>
          </View>
          <View style={styles.ratiosRow}>
            <View style={styles.ratioItem}>
              <Text style={styles.ratioLabel}>Margen</Text>
              <Text style={[styles.ratioValue, { color: stats.margin >= 0 ? colors.success : colors.error }]}>
                {formatPercent(stats.margin)}
              </Text>
            </View>
            <View style={styles.ratioDivider} />
            <View style={styles.ratioItem}>
              <Text style={styles.ratioLabel}>ROI</Text>
              <Text style={[styles.ratioValue, { color: stats.roi >= 0 ? colors.success : colors.error }]}>
                {formatPercent(stats.roi)}
              </Text>
            </View>
          </View>
        </View>

        {expenseBreakdown.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Desglose de Gastos</Text>
            <View style={styles.expenseCard}>
              {expenseBreakdown.map((item) => (
                <View key={item.category} style={styles.expenseRow}>
                  <View style={styles.expenseInfo}>
                    <View style={[styles.expenseDot, { backgroundColor: item.color }]} />
                    <Text style={styles.expenseLabel}>{item.label}</Text>
                  </View>
                  <View style={styles.expenseValues}>
                    <Text style={styles.expenseAmount}>{formatCurrency(item.value)}</Text>
                    <Text style={styles.expensePercent}>{formatPercent(item.percent)}</Text>
                  </View>
                </View>
              ))}
              <View style={styles.expenseBarContainer}>
                {expenseBreakdown.map((item) => (
                  <View
                    key={item.category}
                    style={[styles.expenseBarSegment, { backgroundColor: item.color, flex: item.percent }]}
                  />
                ))}
              </View>
            </View>
          </>
        )}

        {chartData && (
          <>
            <Text style={styles.sectionTitle}>Ingresos vs Gastos por Lote</Text>
            <View style={styles.chartCard}>
              <BarChart
                data={chartData}
                width={screenWidth - 60}
                height={220}
                yAxisLabel="C$"
                yAxisSuffix=""
                chartConfig={{
                  backgroundColor: colors.surface,
                  backgroundGradientFrom: colors.surface,
                  backgroundGradientTo: colors.surface,
                  decimalPlaces: 0,
                  color: (opacity = 1) => `rgba(45, 90, 39, ${opacity})`,
                  labelColor: () => colors.textMuted,
                  style: { borderRadius: 16 },
                  barPercentage: 0.6,
                }}
                style={styles.chart}
                showValuesOnTopOfBars={false}
                fromZero
              />
            </View>
          </>
        )}

        <Text style={styles.sectionTitle}>Por Lote</Text>

        {stats.batchStats.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📊</Text>
            <Text style={styles.emptyText}>No hay datos financieros</Text>
            <Text style={styles.emptyHint}>Registra gastos y ventas en tus lotes</Text>
          </View>
        ) : (
          stats.batchStats.map((batch) => (
            <View key={batch.id} style={styles.batchCard}>
              <View style={styles.batchHeader}>
                <Text style={styles.batchName}>{batch.name}</Text>
                <View style={styles.batchProfitContainer}>
                  <Text style={[styles.batchProfit, { color: batch.profit >= 0 ? colors.success : colors.error }]}>
                    {formatCurrency(batch.profit)}
                  </Text>
                  <Text style={[styles.batchMargin, { color: batch.margin >= 0 ? colors.success : colors.error }]}>
                    {formatPercent(batch.margin)}
                  </Text>
                </View>
              </View>
              <View style={styles.batchDetails}>
                <View style={styles.batchDetail}>
                  <Text style={styles.detailLabel}>Ingresos</Text>
                  <Text style={[styles.detailValue, { color: colors.success }]}>{formatCurrency(batch.revenue)}</Text>
                </View>
                <View style={styles.batchDetail}>
                  <Text style={styles.detailLabel}>Gastos</Text>
                  <Text style={[styles.detailValue, { color: colors.error }]}>{formatCurrency(batch.expenses)}</Text>
                </View>
                <View style={styles.batchDetail}>
                  <Text style={styles.detailLabel}>Pollitos</Text>
                  <Text style={styles.detailValue}>{formatCurrency(batch.chickCost)}</Text>
                </View>
                <View style={styles.batchDetail}>
                  <Text style={styles.detailLabel}>Alimento</Text>
                  <Text style={styles.detailValue}>{formatCurrency(batch.feedCost)}</Text>
                </View>
                <View style={styles.batchDetail}>
                  <Text style={styles.detailLabel}>Costo/Ave</Text>
                  <Text style={styles.detailValue}>{formatCurrency(batch.costPerBird)}</Text>
                </View>
                <View style={styles.batchDetail}>
                  <Text style={styles.detailLabel}>ROI</Text>
                  <Text style={[styles.detailValue, { color: batch.roi >= 0 ? colors.success : colors.error }]}>
                    {formatPercent(batch.roi)}
                  </Text>
                </View>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, fontSize: 16, color: colors.textMuted },
  header: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 16, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border },
  headerTitle: { fontSize: 28, fontWeight: '700', color: colors.textPrimary },
  headerSubtitle: { fontSize: 14, color: colors.textMuted, marginTop: 4 },
  content: { padding: 20, paddingBottom: 40 },
  periodFilter: { flexDirection: 'row', marginBottom: 20, backgroundColor: colors.beige, borderRadius: 12, padding: 4 },
  periodButton: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
  periodButtonActive: { backgroundColor: colors.primary },
  periodButtonText: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
  periodButtonTextActive: { color: colors.textLight },
  summaryCard: { backgroundColor: colors.surface, borderRadius: 20, padding: 20, marginBottom: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 3 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  summaryItem: { flex: 1 },
  summaryLabel: { fontSize: 13, color: colors.textMuted, marginBottom: 4 },
  summaryValue: { fontSize: 20, fontWeight: '700' },
  profitContainer: { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 16, alignItems: 'center', marginBottom: 16 },
  profitLabel: { fontSize: 14, color: colors.textMuted, marginBottom: 4 },
  profitValue: { fontSize: 32, fontWeight: '700' },
  ratiosRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', backgroundColor: colors.cream, borderRadius: 12, padding: 12 },
  ratioItem: { flex: 1, alignItems: 'center' },
  ratioDivider: { width: 1, height: 30, backgroundColor: colors.border },
  ratioLabel: { fontSize: 12, color: colors.textMuted, marginBottom: 2 },
  ratioValue: { fontSize: 18, fontWeight: '700' },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: colors.textPrimary, marginBottom: 12 },
  expenseCard: { backgroundColor: colors.surface, borderRadius: 16, padding: 16, marginBottom: 24 },
  expenseRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 },
  expenseInfo: { flexDirection: 'row', alignItems: 'center' },
  expenseDot: { width: 12, height: 12, borderRadius: 6, marginRight: 10 },
  expenseLabel: { fontSize: 14, color: colors.textPrimary },
  expenseValues: { flexDirection: 'row', alignItems: 'center' },
  expenseAmount: { fontSize: 14, fontWeight: '600', color: colors.textPrimary, marginRight: 8 },
  expensePercent: { fontSize: 12, color: colors.textMuted, width: 45, textAlign: 'right' },
  expenseBarContainer: { flexDirection: 'row', height: 8, borderRadius: 4, overflow: 'hidden', marginTop: 12 },
  expenseBarSegment: { height: '100%' },
  chartCard: { backgroundColor: colors.surface, borderRadius: 16, padding: 10, marginBottom: 24, alignItems: 'center' },
  chart: { borderRadius: 12 },
  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 16, color: colors.textSecondary, marginBottom: 4 },
  emptyHint: { fontSize: 14, color: colors.textMuted },
  batchCard: { backgroundColor: colors.surface, borderRadius: 16, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  batchHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
  batchName: { fontSize: 16, fontWeight: '600', color: colors.textPrimary, flex: 1 },
  batchProfitContainer: { alignItems: 'flex-end' },
  batchProfit: { fontSize: 18, fontWeight: '700' },
  batchMargin: { fontSize: 12, fontWeight: '500' },
  batchDetails: { flexDirection: 'row', flexWrap: 'wrap' },
  batchDetail: { width: '50%', marginBottom: 8 },
  detailLabel: { fontSize: 12, color: colors.textMuted },
  detailValue: { fontSize: 14, fontWeight: '500', color: colors.textSecondary },
});