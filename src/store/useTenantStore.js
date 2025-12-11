import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const useTenantStore = create((set) => ({
  orgSlug: null,

  setOrgSlug: async (slug) => {
    await AsyncStorage.setItem("orgSlug", slug);
    set({ orgSlug: slug });
  },

  loadOrgSlug: async () => {
    const slug = await AsyncStorage.getItem("orgSlug");
    if (slug) set({ orgSlug: slug });
  },

  clearOrgSlug: async () => {
    await AsyncStorage.removeItem("orgSlug");
    set({ orgSlug: null });
  },
}));
