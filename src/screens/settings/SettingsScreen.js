import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  FlatList,
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
  earth: '#6B4423',
  textPrimary: '#2C2C2C',
  textSecondary: '#5C5C5C',
  textMuted: '#8C8C8C',
  textLight: '#FFFFFF',
  surface: '#FFFFFF',
  border: '#E8DCC8',
  error: '#E53935',
  success: '#4CAF50',
};

export default function SettingsScreen({ navigation }) {
  const orgSlug = useTenantStore((s) => s.orgSlug);
  const clearOrgSlug = useTenantStore((s) => s.clearOrgSlug);
  
  const [farms, setFarms] = useState([]);
  const [houses, setHouses] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  
  const [modalType, setModalType] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [formData, setFormData] = useState({});
  const [selectedFarm, setSelectedFarm] = useState(null);

  const loadData = useCallback(async () => {
    try {
      const [farmsRes, housesRes, workersRes] = await Promise.all([
        supabase.from("farms").select("*").eq("org_slug", orgSlug).order("created_at", { ascending: false }),
        supabase.from("houses").select("*, farms(name)").order("created_at", { ascending: false }),
        supabase.from("workers").select("*").eq("org_slug", orgSlug).order("created_at", { ascending: false }),
      ]);
      setFarms(farmsRes.data || []);
      setHouses(housesRes.data || []);
      setWorkers(workersRes.data || []);
    } catch (error) {
      console.log("Error loading settings data:", error);
    } finally {
      setRefreshing(false);
    }
  }, [orgSlug]);

  useEffect(() => { loadData(); }, [loadData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
  }, [loadData]);

  function openModal(type, data = {}) {
    setModalType(type);
    setFormData(data);
    setModalVisible(true);
  }

  function closeModal() {
    setModalVisible(false);
    setFormData({});
    setModalType(null);
  }

  async function handleSave() {
    try {
      if (modalType === 'farm') {
        if (!formData.name) return Alert.alert("Error", "Ingresa el nombre de la granja");
        if (formData.id) {
          await supabase.from("farms").update({ name: formData.name, location: formData.location }).eq("id", formData.id);
        } else {
          await supabase.from("farms").insert({ org_slug: orgSlug, name: formData.name, location: formData.location });
        }
      } else if (modalType === 'house') {
        if (!formData.name) return Alert.alert("Error", "Ingresa el nombre del galpón");
        if (!formData.farm_id) return Alert.alert("Error", "Selecciona una granja");
        if (formData.id) {
          await supabase.from("houses").update({ name: formData.name, capacity: formData.capacity ? Number(formData.capacity) : null, farm_id: formData.farm_id }).eq("id", formData.id);
        } else {
          await supabase.from("houses").insert({ name: formData.name, capacity: formData.capacity ? Number(formData.capacity) : null, farm_id: formData.farm_id });
        }
      } else if (modalType === 'worker') {
        if (!formData.name) return Alert.alert("Error", "Ingresa el nombre del trabajador");
        if (formData.id) {
          await supabase.from("workers").update({ name: formData.name, role: formData.role, phone: formData.phone }).eq("id", formData.id);
        } else {
          await supabase.from("workers").insert({ org_slug: orgSlug, name: formData.name, role: formData.role, phone: formData.phone });
        }
      }
      closeModal();
      loadData();
      Alert.alert("Guardado", "Los datos se guardaron correctamente");
    } catch (error) {
      Alert.alert("Error", error.message);
    }
  }

  async function handleDelete(type, id) {
    Alert.alert("Eliminar", "¿Estás seguro?", [
      { text: "Cancelar", style: "cancel" },
      { text: "Eliminar", style: "destructive", onPress: async () => {
        try {
          await supabase.from(type).delete().eq("id", id);
          loadData();
        } catch (error) {
          Alert.alert("Error", error.message);
        }
      }}
    ]);
  }

  async function handleLogout() {
    Alert.alert("Cerrar sesión", "¿Estás seguro?", [
      { text: "Cancelar", style: "cancel" },
      { text: "Salir", style: "destructive", onPress: async () => {
        await supabase.auth.signOut();
        clearOrgSlug();
        navigation.getParent()?.reset({ index: 0, routes: [{ name: 'Login' }] });
      }}
    ]);
  }

  const renderModal = () => {
    if (!modalType) return null;
    
    return (
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {formData.id ? 'Editar' : 'Agregar'} {modalType === 'farm' ? 'Granja' : modalType === 'house' ? 'Galpón' : 'Trabajador'}
            </Text>
            
            <TextInput
              style={styles.input}
              placeholder="Nombre *"
              placeholderTextColor={colors.textMuted}
              value={formData.name || ''}
              onChangeText={(text) => setFormData({...formData, name: text})}
            />
            
            {modalType === 'farm' && (
              <TextInput
                style={styles.input}
                placeholder="Ubicación"
                placeholderTextColor={colors.textMuted}
                value={formData.location || ''}
                onChangeText={(text) => setFormData({...formData, location: text})}
              />
            )}
            
            {modalType === 'house' && (
              <>
                <Text style={styles.inputLabel}>Granja *</Text>
                <ScrollView horizontal style={styles.farmSelector}>
                  {farms.map(farm => (
                    <TouchableOpacity
                      key={farm.id}
                      style={[styles.farmOption, formData.farm_id === farm.id && styles.farmOptionActive]}
                      onPress={() => setFormData({...formData, farm_id: farm.id})}
                    >
                      <Text style={[styles.farmOptionText, formData.farm_id === farm.id && styles.farmOptionTextActive]}>{farm.name}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
                <TextInput
                  style={styles.input}
                  placeholder="Capacidad (aves)"
                  placeholderTextColor={colors.textMuted}
                  value={formData.capacity?.toString() || ''}
                  onChangeText={(text) => setFormData({...formData, capacity: text})}
                  keyboardType="numeric"
                />
              </>
            )}
            
            {modalType === 'worker' && (
              <>
                <TextInput
                  style={styles.input}
                  placeholder="Rol/Cargo"
                  placeholderTextColor={colors.textMuted}
                  value={formData.role || ''}
                  onChangeText={(text) => setFormData({...formData, role: text})}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Teléfono"
                  placeholderTextColor={colors.textMuted}
                  value={formData.phone || ''}
                  onChangeText={(text) => setFormData({...formData, phone: text})}
                  keyboardType="phone-pad"
                />
              </>
            )}
            
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.cancelBtn} onPress={closeModal}>
                <Text style={styles.cancelBtnText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                <Text style={styles.saveBtnText}>Guardar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Ajustes</Text>
        <Text style={styles.orgSlug}>Org: {orgSlug}</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
      >
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Granjas ({farms.length})</Text>
            <TouchableOpacity style={styles.addBtn} onPress={() => openModal('farm')}>
              <Text style={styles.addBtnText}>+ Agregar</Text>
            </TouchableOpacity>
          </View>
          {farms.length === 0 ? (
            <Text style={styles.emptyText}>Sin granjas registradas</Text>
          ) : (
            farms.map(farm => (
              <View key={farm.id} style={styles.listItem}>
                <View style={styles.listItemContent}>
                  <Text style={styles.listItemIcon}>🏠</Text>
                  <View>
                    <Text style={styles.listItemTitle}>{farm.name}</Text>
                    {farm.location && <Text style={styles.listItemSubtitle}>{farm.location}</Text>}
                  </View>
                </View>
                <View style={styles.listItemActions}>
                  <TouchableOpacity onPress={() => openModal('farm', farm)}>
                    <Text style={styles.editBtn}>Editar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleDelete('farms', farm.id)}>
                    <Text style={styles.deleteBtn}>Eliminar</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Galpones ({houses.length})</Text>
            <TouchableOpacity style={styles.addBtn} onPress={() => openModal('house')}>
              <Text style={styles.addBtnText}>+ Agregar</Text>
            </TouchableOpacity>
          </View>
          {houses.length === 0 ? (
            <Text style={styles.emptyText}>Sin galpones registrados</Text>
          ) : (
            houses.map(house => (
              <View key={house.id} style={styles.listItem}>
                <View style={styles.listItemContent}>
                  <Text style={styles.listItemIcon}>🏚️</Text>
                  <View>
                    <Text style={styles.listItemTitle}>{house.name}</Text>
                    <Text style={styles.listItemSubtitle}>{house.farms?.name} {house.capacity ? `- ${house.capacity} aves` : ''}</Text>
                  </View>
                </View>
                <View style={styles.listItemActions}>
                  <TouchableOpacity onPress={() => openModal('house', house)}>
                    <Text style={styles.editBtn}>Editar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleDelete('houses', house.id)}>
                    <Text style={styles.deleteBtn}>Eliminar</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Trabajadores ({workers.length})</Text>
            <TouchableOpacity style={styles.addBtn} onPress={() => openModal('worker')}>
              <Text style={styles.addBtnText}>+ Agregar</Text>
            </TouchableOpacity>
          </View>
          {workers.length === 0 ? (
            <Text style={styles.emptyText}>Sin trabajadores registrados</Text>
          ) : (
            workers.map(worker => (
              <View key={worker.id} style={styles.listItem}>
                <View style={styles.listItemContent}>
                  <Text style={styles.listItemIcon}>👷</Text>
                  <View>
                    <Text style={styles.listItemTitle}>{worker.name}</Text>
                    <Text style={styles.listItemSubtitle}>{worker.role || 'Sin rol'} {worker.phone ? `- ${worker.phone}` : ''}</Text>
                  </View>
                </View>
                <View style={styles.listItemActions}>
                  <TouchableOpacity onPress={() => openModal('worker', worker)}>
                    <Text style={styles.editBtn}>Editar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleDelete('workers', worker.id)}>
                    <Text style={styles.deleteBtn}>Eliminar</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>

        {/* Subscription Button */}
        <TouchableOpacity style={styles.subscriptionBtn} onPress={() => navigation.navigate('Subscription')}>
          <Text style={styles.subscriptionIcon}>⭐</Text>
          <View style={styles.subscriptionInfo}>
            <Text style={styles.subscriptionTitle}>Suscripción Premium</Text>
            <Text style={styles.subscriptionSubtitle}>Ver planes y beneficios</Text>
          </View>
          <Text style={styles.subscriptionArrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutIcon}>🚪</Text>
          <Text style={styles.logoutText}>Cerrar sesión</Text>
        </TouchableOpacity>

        <Text style={styles.version}>Poultry Farm v1.0.0</Text>
      </ScrollView>

      {renderModal()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream },
  header: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 16, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border },
  headerTitle: { fontSize: 28, fontWeight: '700', color: colors.textPrimary },
  orgSlug: { fontSize: 14, color: colors.textMuted, marginTop: 4 },
  content: { padding: 20 },
  section: { marginBottom: 24 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: colors.textPrimary },
  addBtn: { backgroundColor: colors.primary, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  addBtnText: { color: colors.textLight, fontWeight: '600', fontSize: 14 },
  emptyText: { color: colors.textMuted, textAlign: 'center', paddingVertical: 20 },
  listItem: { backgroundColor: colors.surface, borderRadius: 12, padding: 16, marginBottom: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  listItemContent: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  listItemIcon: { fontSize: 24, marginRight: 12 },
  listItemTitle: { fontSize: 16, fontWeight: '600', color: colors.textPrimary },
  listItemSubtitle: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  listItemActions: { flexDirection: 'row', gap: 12 },
  editBtn: { color: colors.primary, fontWeight: '500' },
  deleteBtn: { color: colors.error, fontWeight: '500' },
  subscriptionBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.primary + '10', padding: 16, borderRadius: 12, marginTop: 16, borderWidth: 2, borderColor: colors.primary },
  subscriptionIcon: { fontSize: 28, marginRight: 12 },
  subscriptionInfo: { flex: 1 },
  subscriptionTitle: { fontSize: 16, fontWeight: '600', color: colors.primary },
  subscriptionSubtitle: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  subscriptionArrow: { fontSize: 24, color: colors.primary },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.error + '15', padding: 16, borderRadius: 12, marginTop: 16 },
  logoutIcon: { fontSize: 20, marginRight: 8 },
  logoutText: { fontSize: 16, fontWeight: '600', color: colors.error },
  version: { textAlign: 'center', color: colors.textMuted, marginTop: 24, fontSize: 12 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  modalTitle: { fontSize: 20, fontWeight: '700', color: colors.textPrimary, marginBottom: 20, textAlign: 'center' },
  input: { backgroundColor: colors.cream, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: colors.border, fontSize: 16, color: colors.textPrimary, marginBottom: 12 },
  inputLabel: { fontSize: 14, fontWeight: '600', color: colors.textSecondary, marginBottom: 8 },
  farmSelector: { marginBottom: 12 },
  farmOption: { backgroundColor: colors.beige, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, marginRight: 8 },
  farmOptionActive: { backgroundColor: colors.primary },
  farmOptionText: { color: colors.textSecondary, fontWeight: '500' },
  farmOptionTextActive: { color: colors.textLight },
  modalButtons: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 16 },
  cancelBtn: { flex: 1, padding: 16, borderRadius: 12, backgroundColor: colors.beige, marginRight: 8, alignItems: 'center' },
  cancelBtnText: { color: colors.textSecondary, fontWeight: '600' },
  saveBtn: { flex: 1, padding: 16, borderRadius: 12, backgroundColor: colors.primary, marginLeft: 8, alignItems: 'center' },
  saveBtnText: { color: colors.textLight, fontWeight: '600' },
});