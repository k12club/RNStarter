import React from 'react';
import { View } from 'react-native';

import { Card, Text } from '@/components/ui';
import type { SpacingToken } from '@/theme';

type DemoGroupProps = {
  /** ชื่อคอมโพเนนต์ / หัวข้อย่อย */
  title: string;
  description?: string;
  children: React.ReactNode;
  /** ไม่ห่อด้วย Card (ใช้กับตัวอย่างที่เป็น Card เอง) */
  bare?: boolean;
  /** padding ของ Card (ค่าเริ่มต้น lg) */
  padding?: SpacingToken;
  testID?: string;
};

/** กลุ่มตัวอย่างหนึ่งชุด: หัวข้อย่อย + เนื้อหาใน Card */
export function DemoGroup({
  title,
  description,
  children,
  bare = false,
  padding,
  testID,
}: DemoGroupProps) {
  return (
    <View testID={testID} className="gap-3">
      <View className="gap-1">
        <Text variant="body" weight="semibold">
          {title}
        </Text>
        {description ? (
          <Text variant="bodySmall" color="textSecondary">
            {description}
          </Text>
        ) : null}
      </View>
      {bare ? children : <Card padding={padding}>{children}</Card>}
    </View>
  );
}

type DemoLabelProps = {
  children: React.ReactNode;
};

/** ป้ายกำกับเล็กเหนือตัวอย่าง เช่น ชื่อ variant (caption 14 ไม่ต่ำกว่านี้) */
export function DemoLabel({ children }: DemoLabelProps) {
  return (
    <Text variant="caption" color="textSecondary">
      {children}
    </Text>
  );
}
