import React, { useEffect, useState, useCallback } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Dimensions,
  RefreshControl,
  TextInput,
} from "react-native";
import { supabase } from "../../lib/supabase/client";
import { LineChart } from "react-native-chart-kit";
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

const screenWidth = Dimensions.get("window").width;

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

const TABS = [
  { key: 'resumen', label: 'Resumen' },
  { key: 'graficos', label: 'Gráficos' },
  { key: 'alimento', label: 'Alimento' },
  { key: 'peso', label: 'Peso' },
  { key: 'bajas', label: 'Bajas' },
  { key: 'agua', label: 'Agua' },
  { key: 'vacunas', label: 'Vacunas' },
  { key: 'gastos', label: 'Gastos' },
  { key: 'ventas', label: 'Ventas' },
];

const PURINA_PLAN = [
  { week: 1, name: 'Pre-Iniciarina', days: '0-7', lbPerBird: 0.45 },
  { week: 2, name: 'Iniciarina', days: '8-14', lbPerBird: 0.85 },
  { week: 3, name: 'Iniciarina', days: '15-21', lbPerBird: 1.1 },
  { week: 4, name: 'Engordina', days: '22-28', lbPerBird: 1.8 },
  { week: 5, name: 'Engordina', days: '29-35', lbPerBird: 2.4 },
  { week: 6, name: 'Engordina', days: '36-45', lbPerBird: 2.6 },
];

export default function BatchDetails({ route, navigation }) {
  const params = route?.params || {};
  const { batchId } = params;

  // ALL HOOKS MUST BE CALLED FIRST - before any conditional returns
  const [batch, setBatch] = useState(null);
  const [logs, setLogs] = useState({ feed: [], weight: [], mortality: [], water: [], vaccination: [], expense: [], sale: [] });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('resumen');
  const [pricePerLb, setPricePerLb] = useState('');
  const [profitResult, setProfitResult] = useState(null);

  const loadData = useCallback(async () => {
    if (!batchId) {
      setLoading(false);
      return;
    }
    try {
      const [batchRes, feedRes, weightRes, mortRes, waterRes, vaccRes, expRes, saleRes] = await Promise.all([
        supabase.from("batches").select("*").eq("id", batchId).single(),
        supabase.from("feed_logs").select("*").eq("batch_id", batchId).order("created_at", { ascending: false }),
        supabase.from("weight_logs").select("*").eq("batch_id", batchId).order("created_at", { ascending: false }),
        supabase.from("mortality_logs").select("*").eq("batch_id", batchId).order("created_at", { ascending: false }),
        supabase.from("water_logs").select("*").eq("batch_id", batchId).order("created_at", { ascending: false }),
        supabase.from("vaccination_logs").select("*").eq("batch_id", batchId).order("created_at", { ascending: false }),
        supabase.from("expense_logs").select("*").eq("batch_id", batchId).order("created_at", { ascending: false }),
        supabase.from("sales_logs").select("*").eq("batch_id", batchId).order("created_at", { ascending: false }),
      ]);

      if (batchRes.data) setBatch(batchRes.data);
      setLogs({
        feed: feedRes.data || [],
        weight: weightRes.data || [],
        mortality: mortRes.data || [],
        water: waterRes.data || [],
        vaccination: vaccRes.data || [],
        expense: expRes.data || [],
        sale: saleRes.data || [],
      });
    } catch (error) {
      console.log("Error loading data:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [batchId]);

  useEffect(() => { loadData(); }, [loadData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
  }, [loadData]);

  // NOW we can check for missing batchId - AFTER all hooks
  if (!batchId) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#FDF8F3', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        <Text style={{ fontSize: 48, marginBottom: 16 }}>⚠️</Text>
        <Text style={{ fontSize: 18, fontWeight: '600', color: '#2C2C2C', marginBottom: 8, textAlign: 'center' }}>Error: Falta información del lote</Text>
        <Text style={{ fontSize: 14, color: '#5C5C5C', marginBottom: 24, textAlign: 'center' }}>No se pudo cargar el lote porque falta el identificador.</Text>
        <TouchableOpacity 
          style={{ backgroundColor: '#2D5A27', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 }}
          onPress={() => navigation.goBack()}
        >
          <Text style={{ color: '#FFFFFF', fontWeight: '600', fontSize: 16 }}>← Volver</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  function formatDate(dateString) {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  }

  function getDaysActive() {
    if (!batch?.start_date) return 0;
    return Math.ceil((new Date() - new Date(batch.start_date)) / (1000 * 60 * 60 * 24));
  }

  function getCurrentWeek() {
    return Math.min(Math.ceil(getDaysActive() / 7), 6);
  }

  function getBirdsAlive() {
    const initial = Number(batch?.initial_quantity ?? 0);
    const deaths = logs.mortality.reduce((sum, m) => sum + Number(m?.count ?? 0), 0);
    return Math.max(0, initial - deaths);
  }

  function getTotalFeedLb() {
    return logs.feed.reduce((sum, f) => sum + (Number(f?.quantity_kg ?? 0) * KG_TO_LB), 0);
  }

  function getTotalFeedKg() {
    return logs.feed.reduce((sum, f) => sum + Number(f?.quantity_kg ?? 0), 0);
  }

  function getAvgWeightLb() {
    if (!logs.weight?.length) return 0;
    const avgKg = Number(logs.weight[0]?.avg_weight_kg ?? 0);
    return isFinite(avgKg) ? avgKg * KG_TO_LB : 0;
  }

  function getTotalWeightKg() {
    if (!logs.weight?.length) return 0;
    const avgKg = Number(logs.weight[0]?.avg_weight_kg ?? 0);
    return isFinite(avgKg) ? avgKg * getBirdsAlive() : 0;
  }

  function getFCR() {
    const weightKg = getTotalWeightKg();
    if (!weightKg) return 0;
    const ratio = getTotalFeedKg() / weightKg;
    return isFinite(ratio) ? ratio : 0;
  }

  function getMortalityRate() {
    const initial = Number(batch?.initial_quantity ?? 0);
    if (!initial) return 0;
    const deaths = logs.mortality.reduce((sum, m) => sum + Number(m?.count ?? 0), 0);
    return (deaths / initial) * 100;
  }

  function getPurinaRecommendation() {
    const week = getCurrentWeek();
    const birdsAlive = getBirdsAlive();
    if (!week || !birdsAlive) return null;
    const plan = PURINA_PLAN[week - 1] || PURINA_PLAN[5];
    const weeklyLb = plan.lbPerBird * birdsAlive;
    return { ...plan, weeklyLb, dailyLb: weeklyLb / 7, sacksWeekly: weeklyLb / 100, birdsAlive };
  }

  function getWeightChartData() {
    const data = [...logs.weight].reverse().slice(-7);
    if (!data.length) return null;
    const values = data.map(w => {
      const val = Number(w.avg_weight_kg ?? 0) * KG_TO_LB;
      return isFinite(val) ? val : 0;
    });
    if (values.every(v => v === 0)) return null;
    return { labels: data.map((_, i) => `D${i + 1}`), datasets: [{ data: values }] };
  }

  function getFeedChartData() {
    const data = [...logs.feed].reverse().slice(-7);
    if (!data.length) return null;
    const values = data.map(f => {
      const val = Number(f.quantity_kg ?? 0) * KG_TO_LB;
      return isFinite(val) ? val : 0;
    });
    if (values.every(v => v === 0)) return null;
    return { labels: data.map((_, i) => `D${i + 1}`), datasets: [{ data: values }] };
  }

  async function handleCloseBatch() {
    Alert.alert("Cerrar Lote", "¿Estás seguro?", [
      { text: "Cancelar", style: "cancel" },
      { text: "Cerrar", style: "destructive", onPress: async () => {
        await supabase.from("batches").update({ status: "completed", end_date: new Date().toISOString() }).eq("id", batchId);
        Alert.alert("Lote Cerrado");
        navigation.goBack();
      }}
    ]);
  }

  async function handleDeleteLog(tableName, logId, logType) {
    Alert.alert(
      "Eliminar Registro",
      `¿Estás seguro de que deseas eliminar este registro de ${logType}? Esta acción no se puede deshacer.`,
      [
        { text: "Cancelar", style: "cancel" },
        { 
          text: "Eliminar", 
          style: "destructive", 
          onPress: async () => {
            try {
              const { error } = await supabase.from(tableName).delete().eq("id", logId);
              if (error) {
                Alert.alert("Error", "No se pudo eliminar el registro");
                console.log("Delete error:", error);
              } else {
                Alert.alert("Eliminado", "El registro ha sido eliminado");
                loadData();
              }
            } catch (err) {
              Alert.alert("Error", "Ocurrió un error inesperado");
              console.log("Delete error:", err);
            }
          }
        }
      ]
    );
  }

  function getTotalExpenses() {
    return logs.expense.reduce((sum, e) => sum + Number(e?.amount ?? 0), 0);
  }

  function getTotalSales() {
    return logs.sale.reduce((sum, s) => sum + Number(s?.total_amount ?? 0), 0);
  }

  function getTotalDeaths() {
    return logs.mortality.reduce((sum, m) => sum + Number(m?.count ?? 0), 0);
  }

  async function generatePDF() {
    try {
      const totalFeedLb = getTotalFeedLb();
      const totalExpenses = getTotalExpenses();
      const totalSales = getTotalSales();
      const totalDeaths = getTotalDeaths();
      const profit = totalSales - totalExpenses;

      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Reporte de Lote - ${batch.name}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; color: #333; }
            h1 { color: #2D5A27; border-bottom: 2px solid #2D5A27; padding-bottom: 10px; }
            h2 { color: #2D5A27; margin-top: 30px; }
            .header-info { background: #f5f5f5; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
            .kpi-grid { display: flex; flex-wrap: wrap; gap: 15px; margin-bottom: 20px; }
            .kpi-card { background: #E8F5E9; padding: 15px; border-radius: 8px; min-width: 120px; text-align: center; }
            .kpi-value { font-size: 24px; font-weight: bold; color: #2D5A27; }
            .kpi-label { font-size: 12px; color: #666; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
            th { background: #2D5A27; color: white; }
            tr:nth-child(even) { background: #f9f9f9; }
            .profit-positive { color: #4CAF50; font-weight: bold; }
            .profit-negative { color: #E53935; font-weight: bold; }
            .footer { margin-top: 30px; text-align: center; color: #888; font-size: 12px; }
          </style>
        </head>
        <body>
          <h1>Reporte de Lote: ${batch.name}</h1>
        
          <div class="header-info">
            <p><strong>Fecha de inicio:</strong> ${new Date(batch.start_date).toLocaleDateString('es-ES')}</p>
            <p><strong>Estado:</strong> ${batch.status === 'completed' ? 'Cerrado' : 'Activo'}</p>
            ${batch.end_date ? `<p><strong>Fecha de cierre:</strong> ${new Date(batch.end_date).toLocaleDateString('es-ES')}</p>` : ''}
            <p><strong>Aves iniciales:</strong> ${batch.initial_quantity}</p>
            <p><strong>Días activo:</strong> ${getDaysActive()}</p>
          </div>

          <h2>Indicadores Clave (KPIs)</h2>
          <div class="kpi-grid">
            <div class="kpi-card">
              <div class="kpi-value">${getBirdsAlive()}</div>
              <div class="kpi-label">Aves Vivas</div>
            </div>
            <div class="kpi-card">
              <div class="kpi-value">${getFCR().toFixed(2)}</div>
              <div class="kpi-label">FCR</div>
            </div>
            <div class="kpi-card">
              <div class="kpi-value">${getAvgWeightLb().toFixed(2)}</div>
              <div class="kpi-label">Lb/Ave</div>
            </div>
            <div class="kpi-card">
              <div class="kpi-value">${getMortalityRate().toFixed(1)}%</div>
              <div class="kpi-label">Mortalidad</div>
            </div>
          </div>

          <h2>Resumen Financiero</h2>
          <table>
            <tr><td>Total Gastos</td><td>$${totalExpenses.toFixed(2)}</td></tr>
            <tr><td>Total Ventas</td><td>$${totalSales.toFixed(2)}</td></tr>
            <tr><td>Ganancia/Pérdida</td><td class="${profit >= 0 ? 'profit-positive' : 'profit-negative'}">$${profit.toFixed(2)}</td></tr>
          </table>

          <h2>Resumen de Producción</h2>
          <table>
            <tr><td>Alimento consumido</td><td>${totalFeedLb.toFixed(1)} lb (${getTotalFeedKg().toFixed(1)} kg)</td></tr>
            <tr><td>Bajas totales</td><td>${totalDeaths} aves</td></tr>
            <tr><td>Vacunas aplicadas</td><td>${logs.vaccination.length}</td></tr>
          </table>

          ${logs.feed.length > 0 ? `
          <h2>Historial de Alimento (últimos 10)</h2>
          <table>
            <tr><th>Fecha</th><th>Cantidad (lb)</th><th>Cantidad (kg)</th></tr>
            ${logs.feed.slice(0, 10).map(f => `
              <tr>
                <td>${new Date(f.created_at).toLocaleDateString('es-ES')}</td>
                <td>${(Number(f.quantity_kg ?? 0) * KG_TO_LB).toFixed(1)}</td>
                <td>${Number(f.quantity_kg ?? 0).toFixed(1)}</td>
              </tr>
            `).join('')}
          </table>
          ` : ''}

          ${logs.weight.length > 0 ? `
          <h2>Historial de Peso (últimos 10)</h2>
          <table>
            <tr><th>Fecha</th><th>Peso Promedio (lb)</th><th>Peso Promedio (kg)</th></tr>
            ${logs.weight.slice(0, 10).map(w => `
              <tr>
                <td>${new Date(w.created_at).toLocaleDateString('es-ES')}</td>
                <td>${(Number(w.avg_weight_kg ?? 0) * KG_TO_LB).toFixed(2)}</td>
                <td>${Number(w.avg_weight_kg ?? 0).toFixed(2)}</td>
              </tr>
            `).join('')}
          </table>
          ` : ''}

          ${logs.expense.length > 0 ? `
          <h2>Historial de Gastos</h2>
          <table>
            <tr><th>Fecha</th><th>Categoría</th><th>Monto</th></tr>
            ${logs.expense.map(e => `
              <tr>
                <td>${new Date(e.created_at).toLocaleDateString('es-ES')}</td>
                <td>${e.category || 'General'}</td>
                <td>$${Number(e.amount ?? 0).toFixed(2)}</td>
              </tr>
            `).join('')}
          </table>
          ` : ''}

          ${logs.sale.length > 0 ? `
          <h2>Historial de Ventas</h2>
          <table>
            <tr><th>Fecha</th><th>Cantidad</th><th>Total</th></tr>
            ${logs.sale.map(s => `
              <tr>
                <td>${new Date(s.created_at).toLocaleDateString('es-ES')}</td>
                <td>${s.quantity} aves</td>
                <td>$${Number(s.total_amount ?? 0).toFixed(2)}</td>
              </tr>
            `).join('')}
          </table>
          ` : ''}

          <div class="footer">
            <p>Generado el ${new Date().toLocaleDateString('es-ES')} a las ${new Date().toLocaleTimeString('es-ES')}</p>
            <p>App Avícola - Gestión de Granjas</p>
          </div>
        </body>
        </html>
      `;

      const { uri } = await Print.printToFileAsync({ html });
    
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: `Reporte ${batch.name}`,
          UTI: 'com.adobe.pdf'
        });
      } else {
        Alert.alert('PDF Generado', `El archivo se guardó en: ${uri}`);
      }
    } catch (error) {
      console.log('PDF Error:', error);
      Alert.alert('Error', 'No se pudo generar el PDF');
    }
  }

  function calculateEstimatedProfit() {
    const price = parseFloat(pricePerLb);
    if (!price || price <= 0) {
      Alert.alert("Error", "Ingresa un precio válido por libra");
      return;
    }
    const birds = getBirdsAlive();
    const weightLb = getAvgWeightLb();
    if (!birds || birds <= 0) {
      Alert.alert("Error", "No hay aves vivas registradas");
      return;
    }
    if (!weightLb || weightLb <= 0) {
      Alert.alert("Error", "Registra el peso promedio de las aves primero");
      return;
    }
    const revenue = birds * weightLb * price;
    const expenses = getTotalExpenses();
    const profit = revenue - expenses;
    setProfitResult({ revenue, expenses, profit, birds, weightLb, price });
  }

  if (loading) {
    return <SafeAreaView style={styles.container}><View style={styles.loadingContainer}><ActivityIndicator size="large" color={colors.primary} /></View></SafeAreaView>;
  }

  if (!batch) {
    return <SafeAreaView style={styles.container}><View style={styles.loadingContainer}><Text>No se encontró el lote</Text><TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}><Text style={styles.backBtnText}>Volver</Text></TouchableOpacity></View></SafeAreaView>;
  }

  const daysActive = getDaysActive();
  const birdsAlive = getBirdsAlive();
  const fcr = getFCR();
  const avgWeightLb = getAvgWeightLb();
  const purina = getPurinaRecommendation();
  const mortalityRate = getMortalityRate();
  const weightChart = getWeightChartData();
  const feedChart = getFeedChartData();

  const chartConfig = {
    backgroundGradientFrom: colors.surface,
    backgroundGradientTo: colors.surface,
    color: (opacity = 1) => `rgba(45, 90, 39, ${opacity})`,
    strokeWidth: 2,
    decimalPlaces: 1,
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'resumen':
        return (
          <View>
            <View style={styles.statsGrid}>
              <View style={styles.statCard}><Text style={styles.statValue}>{birdsAlive}</Text><Text style={styles.statLabel}>Aves Vivas</Text></View>
              <View style={styles.statCard}><Text style={styles.statValue}>{daysActive}</Text><Text style={styles.statLabel}>Días</Text></View>
              <View style={styles.statCard}><Text style={[styles.statValue, { color: colors.success }]}>{fcr.toFixed(2)}</Text><Text style={styles.statLabel}>FCR</Text></View>
              <View style={styles.statCard}><Text style={[styles.statValue, { color: colors.primary }]}>{avgWeightLb.toFixed(2)}</Text><Text style={styles.statLabel}>Lb/ave</Text></View>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Acciones Rápidas</Text>
              <View style={styles.actionsGrid}>
                <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate("AddFeedLog", { batchId, batchName: batch.name })}><Text style={styles.actionIcon}>🌾</Text><Text style={styles.actionText}>Alimento</Text></TouchableOpacity>
                <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate("AddWeightLog", { batchId, batchName: batch.name })}><Text style={styles.actionIcon}>📊</Text><Text style={styles.actionText}>Peso</Text></TouchableOpacity>
                <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#FFEBEE' }]} onPress={() => navigation.navigate("AddMortalityLog", { batchId, batchName: batch.name })}><Text style={styles.actionIcon}>💀</Text><Text style={styles.actionText}>Bajas</Text></TouchableOpacity>
                <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate("AddExpenseLog", { batchId, batchName: batch.name })}><Text style={styles.actionIcon}>💸</Text><Text style={styles.actionText}>Gastos</Text></TouchableOpacity>
                <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#E8F5E9' }]} onPress={() => navigation.navigate("AddSaleLog", { batchId, batchName: batch.name })}><Text style={styles.actionIcon}>💰</Text><Text style={styles.actionText}>Ventas</Text></TouchableOpacity>
                <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#E3F2FD' }]} onPress={() => navigation.navigate("AddWaterLog", { batchId, batchName: batch.name })}><Text style={styles.actionIcon}>💧</Text><Text style={styles.actionText}>Agua</Text></TouchableOpacity>
                <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#F3E5F5' }]} onPress={() => navigation.navigate("AddVaccinationLog", { batchId, batchName: batch.name })}><Text style={styles.actionIcon}>💉</Text><Text style={styles.actionText}>Vacunas</Text></TouchableOpacity>
              </View>
            </View>

            {purina && (
              <View style={[styles.card, { backgroundColor: '#E8F5E9' }]}>
                <Text style={styles.cardTitle}>Plan Purina - Semana {purina.week}</Text>
                <Text style={styles.purinaProduct}>{purina.name}</Text>
                <View style={styles.purinaStats}>
                  <View style={styles.purinaStat}><Text style={styles.purinaValue}>{purina.dailyLb.toFixed(1)}</Text><Text style={styles.purinaLabel}>Lb/día</Text></View>
                  <View style={styles.purinaStat}><Text style={styles.purinaValue}>{purina.weeklyLb.toFixed(1)}</Text><Text style={styles.purinaLabel}>Lb/semana</Text></View>
                  <View style={styles.purinaStat}><Text style={styles.purinaValue}>{purina.sacksWeekly.toFixed(1)}</Text><Text style={styles.purinaLabel}>Sacos/sem</Text></View>
                </View>
              </View>
            )}

            <View style={[styles.card, { backgroundColor: '#FFF8E1' }]}>
              <Text style={styles.cardTitle}>Calcular Ganancia Estimada</Text>
              <View style={styles.profitInfo}>
                <Text style={styles.profitInfoText}>Aves vivas: {birdsAlive}</Text>
                <Text style={styles.profitInfoText}>Peso promedio: {avgWeightLb.toFixed(2)} lb/ave</Text>
                <Text style={styles.profitInfoText}>Gastos totales: ${getTotalExpenses().toFixed(2)}</Text>
              </View>
              <View style={styles.priceInputRow}>
                <Text style={styles.priceLabel}>Precio por libra ($):</Text>
                <TextInput
                  style={styles.priceInput}
                  value={pricePerLb}
                  onChangeText={setPricePerLb}
                  placeholder="0.00"
                  keyboardType="decimal-pad"
                  placeholderTextColor={colors.textMuted}
                />
              </View>
              <TouchableOpacity style={styles.calculateBtn} onPress={calculateEstimatedProfit}>
                <Text style={styles.calculateBtnText}>Calcular Ganancia</Text>
              </TouchableOpacity>
              {profitResult && (
                <View style={styles.profitResultContainer}>
                  <View style={styles.profitResultRow}>
                    <Text style={styles.profitResultLabel}>Ingreso estimado:</Text>
                    <Text style={styles.profitResultValue}>${profitResult.revenue.toFixed(2)}</Text>
                  </View>
                  <View style={styles.profitResultRow}>
                    <Text style={styles.profitResultLabel}>Gastos totales:</Text>
                    <Text style={[styles.profitResultValue, { color: colors.error }]}>-${profitResult.expenses.toFixed(2)}</Text>
                  </View>
                  <View style={[styles.profitResultRow, styles.profitFinalRow]}>
                    <Text style={styles.profitFinalLabel}>Ganancia estimada:</Text>
                    <Text style={[styles.profitFinalValue, { color: profitResult.profit >= 0 ? colors.success : colors.error }]}>
                      ${profitResult.profit.toFixed(2)}
                    </Text>
                  </View>
                </View>
              )}
            </View>

            <TouchableOpacity style={styles.closeBtn} onPress={handleCloseBatch}><Text style={styles.closeBtnText}>Cerrar Lote</Text></TouchableOpacity>
          </View>
        );

      case 'graficos':
        return (
          <View>
            {weightChart ? (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Peso Promedio (Lb)</Text>
                <LineChart data={weightChart} width={screenWidth - 60} height={200} chartConfig={chartConfig} bezier style={styles.chart} />
              </View>
            ) : <View style={styles.card}><Text style={styles.emptyText}>Sin datos de peso</Text></View>}
            {feedChart ? (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Consumo de Alimento (Lb)</Text>
                <LineChart data={feedChart} width={screenWidth - 60} height={200} chartConfig={{...chartConfig, color: () => colors.warning}} bezier style={styles.chart} />
              </View>
            ) : <View style={styles.card}><Text style={styles.emptyText}>Sin datos de alimento</Text></View>}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Resumen</Text>
              <View style={styles.summaryRow}><Text style={styles.summaryLabel}>Mortalidad:</Text><Text style={styles.summaryValue}>{mortalityRate.toFixed(1)}%</Text></View>
              <View style={styles.summaryRow}><Text style={styles.summaryLabel}>FCR:</Text><Text style={styles.summaryValue}>{fcr.toFixed(2)}</Text></View>
              <View style={styles.summaryRow}><Text style={styles.summaryLabel}>Total Alimento:</Text><Text style={styles.summaryValue}>{getTotalFeedLb().toFixed(1)} lb</Text></View>
            </View>
          </View>
        );

      default:
        const logMap = { alimento: 'feed', peso: 'weight', bajas: 'mortality', agua: 'water', vacunas: 'vaccination', gastos: 'expense', ventas: 'sale' };
        const tableMap = { alimento: 'feed_logs', peso: 'weight_logs', bajas: 'mortality_logs', agua: 'water_logs', vacunas: 'vaccination_logs', gastos: 'expense_logs', ventas: 'sales_logs' };
        const labelMap = { alimento: 'alimento', peso: 'peso', bajas: 'mortalidad', agua: 'agua', vacunas: 'vacuna', gastos: 'gasto', ventas: 'venta' };
        const logData = logs[logMap[activeTab]] || [];
        return (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Historial de {TABS.find(t => t.key === activeTab)?.label}</Text>
            {!logData.length ? <Text style={styles.emptyText}>Sin registros</Text> : logData.map((log, idx) => (
              <View key={log.id || idx} style={styles.logItem}>
                <View style={styles.logInfo}>
                  <Text style={styles.logDate}>{formatDate(log.created_at)}</Text>
                  <Text style={styles.logValue}>
                    {activeTab === 'alimento' && `${(Number(log.quantity_kg ?? 0) * KG_TO_LB).toFixed(1)} lb`}
                    {activeTab === 'peso' && `${(Number(log.avg_weight_kg ?? 0) * KG_TO_LB).toFixed(2)} lb/ave`}
                    {activeTab === 'bajas' && `${log.count} aves`}
                    {activeTab === 'agua' && `${log.liters} litros`}
                    {activeTab === 'vacunas' && log.vaccine_name}
                    {activeTab === 'gastos' && `$${Number(log.amount ?? 0).toFixed(2)} - ${log.category}`}
                    {activeTab === 'ventas' && `${log.quantity} aves - $${Number(log.total_amount ?? 0).toFixed(2)}`}
                  </Text>
                </View>
                <TouchableOpacity 
                  style={styles.deleteBtn} 
                  onPress={() => handleDeleteLog(tableMap[activeTab], log.id, labelMap[activeTab])}
                >
                  <Text style={styles.deleteBtnText}>Eliminar</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Text style={styles.backText}>← Volver</Text></TouchableOpacity>
        <Text style={styles.headerTitle}>{batch.name}</Text>
        <TouchableOpacity style={styles.pdfBtn} onPress={generatePDF}>
          <Text style={styles.pdfBtnText}>PDF</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.tabsWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsContent}>
          {TABS.map(tab => (
            <TouchableOpacity key={tab.key} style={[styles.tab, activeTab === tab.key && styles.tabActive]} onPress={() => setActiveTab(tab.key)}>
              <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>{tab.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}>
        {renderTabContent()}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  backBtn: { backgroundColor: colors.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12, marginTop: 16 },
  backBtnText: { color: colors.textLight, fontWeight: '600' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border },
  backText: { fontSize: 16, color: colors.primary, fontWeight: '500' },
  headerTitle: { fontSize: 18, fontWeight: '600', color: colors.textPrimary },
  pdfBtn: { backgroundColor: colors.primary, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  pdfBtnText: { color: colors.textLight, fontWeight: '600', fontSize: 14 },
  tabsWrapper: { backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border, paddingVertical: 12, zIndex: 10, elevation: 5 },
  tabsContent: { paddingHorizontal: 16 },
  tab: { paddingHorizontal: 16, paddingVertical: 10, marginRight: 8, borderRadius: 20, backgroundColor: colors.beige },
  tabActive: { backgroundColor: colors.primary },
  tabText: { fontSize: 14, color: colors.textSecondary, fontWeight: '500' },
  tabTextActive: { color: colors.textLight },
  content: { padding: 20 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 20 },
  statCard: { width: '48%', backgroundColor: colors.surface, borderRadius: 16, padding: 16, alignItems: 'center', marginBottom: 12 },
  statValue: { fontSize: 28, fontWeight: '700', color: colors.textPrimary },
  statLabel: { fontSize: 12, color: colors.textMuted, marginTop: 4 },
  card: { backgroundColor: colors.surface, borderRadius: 16, padding: 16, marginBottom: 16 },
  cardTitle: { fontSize: 16, fontWeight: '600', color: colors.textPrimary, marginBottom: 12 },
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  actionBtn: { width: '31%', backgroundColor: colors.beige, borderRadius: 12, padding: 12, alignItems: 'center', marginBottom: 8 },
  actionIcon: { fontSize: 24, marginBottom: 4 },
  actionText: { fontSize: 11, color: colors.textSecondary, fontWeight: '500' },
  purinaProduct: { fontSize: 18, fontWeight: '600', color: colors.primary, marginBottom: 12 },
  purinaStats: { flexDirection: 'row', justifyContent: 'space-around' },
  purinaStat: { alignItems: 'center' },
  purinaValue: { fontSize: 24, fontWeight: '700', color: colors.primary },
  purinaLabel: { fontSize: 12, color: colors.textMuted },
  closeBtn: { backgroundColor: colors.error, paddingVertical: 16, borderRadius: 14, alignItems: 'center', marginTop: 8 },
  closeBtnText: { color: colors.textLight, fontWeight: '700', fontSize: 16 },
  chart: { borderRadius: 12, marginTop: 8 },
  emptyText: { textAlign: 'center', color: colors.textMuted, paddingVertical: 20 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.border },
  summaryLabel: { color: colors.textSecondary },
  summaryValue: { fontWeight: '600', color: colors.textPrimary },
  logItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
  logInfo: { flex: 1 },
  logDate: { color: colors.textMuted, fontSize: 14 },
  logValue: { color: colors.textPrimary, fontWeight: '500', marginTop: 2 },
  deleteBtn: { backgroundColor: colors.error, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, marginLeft: 12 },
  deleteBtnText: { color: colors.textLight, fontSize: 12, fontWeight: '600' },
  profitInfo: { marginBottom: 12 },
  profitInfoText: { fontSize: 14, color: colors.textSecondary, marginBottom: 4 },
  priceInputRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  priceLabel: { fontSize: 14, color: colors.textPrimary, marginRight: 8 },
  priceInput: { flex: 1, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, fontSize: 16, color: colors.textPrimary },
  calculateBtn: { backgroundColor: colors.primary, paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  calculateBtnText: { color: colors.textLight, fontWeight: '600', fontSize: 16 },
  profitResultContainer: { marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: colors.border },
  profitResultRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  profitResultLabel: { fontSize: 14, color: colors.textSecondary },
  profitResultValue: { fontSize: 14, fontWeight: '600', color: colors.textPrimary },
  profitFinalRow: { marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: colors.border },
  profitFinalLabel: { fontSize: 16, fontWeight: '600', color: colors.textPrimary },
  profitFinalValue: { fontSize: 20, fontWeight: '700' },
});