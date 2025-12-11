import React, { useEffect, useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Text, View, ActivityIndicator } from "react-native";

import LoginScreen from "../screens/auth/LoginScreen";
import RegisterScreen from "../screens/auth/RegisterScreen";
import ForgotPasswordScreen from "../screens/auth/ForgotPasswordScreen";

import DashboardScreen from "../screens/dashboard/DashboardScreen";

import BatchList from "../screens/batches/BatchList";
import CreateBatch from "../screens/batches/CreateBatch";
import BatchDetails from "../screens/batches/BatchDetails";
import BatchComparisonScreen from "../screens/batches/BatchComparisonScreen";

import AddFeedLog from "../screens/logs/AddFeedLog";
import AddWeightLog from "../screens/logs/AddWeightLog";
import AddMortalityLog from "../screens/logs/AddMortalityLog";
import AddExpenseLog from "../screens/logs/AddExpenseLog";
import AddSaleLog from "../screens/logs/AddSaleLog";
import AddVaccinationLog from "../screens/logs/AddVaccinationLog";
import AddWaterLog from "../screens/logs/AddWaterLog";

import FinanceScreen from "../screens/finance/FinanceScreen";
import SettingsScreen from "../screens/settings/SettingsScreen";

import SubscriptionScreen from "../screens/subscription/SubscriptionScreen";
import PaymentMethodScreen from "../screens/subscription/PaymentMethodScreen";
import TransferPaymentScreen from "../screens/subscription/TransferPaymentScreen";

import { supabase } from "../lib/supabase/client";
import { useSubscriptionStore } from "../store/useSubscriptionStore";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const colors = {
  primary: '#2D5A27',
  inactive: '#8C8C8C',
  background: '#FFFFFF',
  border: '#E8DCC8',
  cream: '#FDF8F3',
};

function TabIcon({ icon, focused }) {
  return (
    <Text style={{ fontSize: 24, opacity: focused ? 1 : 0.5 }}>
      {icon}
    </Text>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          paddingTop: 8,
          paddingBottom: 24,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.inactive,
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
          marginTop: 4,
        },
      }}
    >
      <Tab.Screen 
        name="DashboardTab" 
        component={DashboardScreen}
        options={{
          tabBarLabel: 'Inicio',
          tabBarIcon: ({ focused }) => <TabIcon icon="🏠" focused={focused} />,
        }}
      />
      <Tab.Screen 
        name="BatchesTab" 
        component={BatchesStack}
        options={{
          tabBarLabel: 'Lotes',
          tabBarIcon: ({ focused }) => <TabIcon icon="🐔" focused={focused} />,
        }}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            e.preventDefault();
            navigation.navigate('BatchesTab', { screen: 'BatchList' });
          },
        })}
      />
      <Tab.Screen 
        name="FinanceTab" 
        component={FinanceScreen}
        options={{
          tabBarLabel: 'Finanzas',
          tabBarIcon: ({ focused }) => <TabIcon icon="💰" focused={focused} />,
        }}
      />
      <Tab.Screen 
        name="SettingsTab" 
        component={SettingsScreen}
        options={{
          tabBarLabel: 'Ajustes',
          tabBarIcon: ({ focused }) => <TabIcon icon="⚙️" focused={focused} />,
        }}
      />
    </Tab.Navigator>
  );
}

function BatchesStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="BatchList" component={BatchList} />
      <Stack.Screen name="CreateBatch" component={CreateBatch} />
      <Stack.Screen name="BatchDetails" component={BatchDetails} />
      <Stack.Screen name="BatchComparison" component={BatchComparisonScreen} />
      <Stack.Screen name="AddFeedLog" component={AddFeedLog} />
      <Stack.Screen name="AddWeightLog" component={AddWeightLog} />
      <Stack.Screen name="AddMortalityLog" component={AddMortalityLog} />
      <Stack.Screen name="AddExpenseLog" component={AddExpenseLog} />
      <Stack.Screen name="AddSaleLog" component={AddSaleLog} />
      <Stack.Screen name="AddVaccinationLog" component={AddVaccinationLog} />
      <Stack.Screen name="AddWaterLog" component={AddWaterLog} />
    </Stack.Navigator>
  );
}

function LoadingScreen() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.cream }}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={{ marginTop: 12, color: colors.primary }}>Cargando...</Text>
    </View>
  );
}

export default function AppNavigator() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const { fetchSubscription } = useSubscriptionStore();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
      if (session?.user?.id) {
        fetchSubscription(session.user.id);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user?.id) {
        fetchSubscription(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!session ? (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
            <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
          </>
        ) : (
          <>
            <Stack.Screen name="Dashboard" component={MainTabs} />
            <Stack.Screen name="Subscription" component={SubscriptionScreen} />
            <Stack.Screen name="PaymentMethod" component={PaymentMethodScreen} />
            <Stack.Screen name="TransferPayment" component={TransferPaymentScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}