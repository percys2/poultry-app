import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { CompositeScreenProps, NavigatorScreenParams } from '@react-navigation/native';

// Root Stack Navigator
export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  Dashboard: NavigatorScreenParams<MainTabParamList>;
};

// Main Tab Navigator
export type MainTabParamList = {
  DashboardTab: undefined;
  BatchesTab: NavigatorScreenParams<BatchesStackParamList>;
  FinanceTab: undefined;
  SettingsTab: undefined;
};

// Batches Stack Navigator
export type BatchesStackParamList = {
  BatchList: undefined;
  CreateBatch: undefined;
  BatchDetails: { batchId: string };
  BatchComparison: undefined;
  AddFeedLog: { batchId: string; batchName: string };
  AddWeightLog: { batchId: string; batchName: string };
  AddMortalityLog: { batchId: string; batchName: string };
  AddExpenseLog: { batchId: string; batchName: string };
  AddSaleLog: { batchId: string; batchName: string };
  AddVaccinationLog: { batchId: string; batchName: string };
  AddWaterLog: { batchId: string; batchName: string };
};

// Screen Props Types
export type RootStackScreenProps<T extends keyof RootStackParamList> = NativeStackScreenProps<
  RootStackParamList,
  T
>;

export type MainTabScreenProps<T extends keyof MainTabParamList> = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, T>,
  RootStackScreenProps<keyof RootStackParamList>
>;

export type BatchesStackScreenProps<T extends keyof BatchesStackParamList> = CompositeScreenProps<
  NativeStackScreenProps<BatchesStackParamList, T>,
  MainTabScreenProps<keyof MainTabParamList>
>;

// Declare global navigation types
declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
