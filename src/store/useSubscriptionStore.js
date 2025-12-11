import { create } from 'zustand';
import { supabase } from '../lib/supabase/client';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SUBSCRIPTION_CACHE_KEY = '@subscription_cache';

export const useSubscriptionStore = create((set, get) => ({
  subscription: null,
  loading: false,
  error: null,

  isPremium: () => {
    const { subscription } = get();
    if (!subscription) return false;
    if (subscription.status !== 'active') return false;
    if (subscription.plan === 'free') return false;
    if (subscription.expires_at && new Date(subscription.expires_at) < new Date()) return false;
    return true;
  },

  getDaysRemaining: () => {
    const { subscription } = get();
    if (!subscription || !subscription.expires_at) return 0;
    const now = new Date();
    const expires = new Date(subscription.expires_at);
    const diff = expires - now;
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  },

  fetchSubscription: async (userId) => {
    if (!userId) {
      set({ loading: false });
      return null;
    }
    
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.log('Subscription fetch error:', error);
        set({ error: error.message, loading: false });
        return null;
      }

      if (!data) {
        // No subscription - user is on free plan
        set({ subscription: { plan: 'free', status: 'active' }, loading: false });
        return null;
      }

      set({ subscription: data, loading: false });
      return data;
    } catch (error) {
      console.log('Error fetching subscription:', error);
      set({ error: error.message, loading: false, subscription: { plan: 'free', status: 'active' } });
      return null;
    }
  },

  updateSubscription: async (userId, updates) => {
    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .update(updates)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;

      set({ subscription: data });
      return data;
    } catch (error) {
      console.log('Error updating subscription:', error);
      set({ error: error.message });
      return null;
    }
  },

  logPayment: async (paymentData) => {
    try {
      const { data, error } = await supabase
        .from('payment_logs')
        .insert(paymentData)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.log('Error logging payment:', error);
      return null;
    }
  },

  clearSubscription: () => {
    set({ subscription: null, loading: false, error: null });
  },
}));