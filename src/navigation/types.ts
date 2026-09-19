import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type {
  CompositeScreenProps,
  NavigatorScreenParams,
} from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

/**
 * Route ทั้งหมดของแอปและ params ของแต่ละหน้า
 * เพิ่มหน้าใหม่: เพิ่ม key ที่นี่ -> ลงทะเบียนใน RootNavigator -> (ถ้าต้องเปิดผ่าน deep link) เพิ่มใน linking.ts
 */
export type RootStackParamList = {
  // ยังไม่ได้เข้าสู่ระบบ
  Login: undefined;

  // เข้าสู่ระบบแล้ว
  MainTabs: NavigatorScreenParams<MainTabParamList> | undefined;
  ProductDetail: { id: number; title?: string };
  Settings: undefined;

  // เปิดได้ทั้งก่อนและหลังเข้าสู่ระบบ
  ComponentGallery: undefined;
  WebView: { url: string; title?: string };
};

export type MainTabParamList = {
  Home: undefined;
  Products: undefined;
  Profile: undefined;
};

export type RootStackScreenProps<T extends keyof RootStackParamList> =
  NativeStackScreenProps<RootStackParamList, T>;

export type MainTabScreenProps<T extends keyof MainTabParamList> =
  CompositeScreenProps<
    BottomTabScreenProps<MainTabParamList, T>,
    RootStackScreenProps<keyof RootStackParamList>
  >;

declare global {
  namespace ReactNavigation {
    // ทำให้ useNavigation() รู้จัก route ทั้งหมดโดยไม่ต้องใส่ generic
    interface RootParamList extends RootStackParamList {}
  }
}
