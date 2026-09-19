// Reanimated ประกาศ matcher ไว้ในไฟล์ .native.d.ts ที่ TypeScript ไม่โหลด จึงประกาศเอง
declare global {
  namespace jest {
    interface Matchers<R> {
      toHaveAnimatedStyle(
        style: Record<string, unknown>[] | Record<string, unknown>,
        config?: { shouldMatchAllProps?: boolean },
      ): R;
      toHaveAnimatedProps(props: Record<string, unknown>): R;
    }
  }
}

export {};
