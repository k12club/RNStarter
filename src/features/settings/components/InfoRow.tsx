import React from 'react';
import { View } from 'react-native';

import { Text } from '@/components/ui';
import { makeStyles } from '@/theme';

export type InfoRowProps = {
  label: string;
  value: string;
  testID?: string;
};

/**
 * แถวข้อมูลแบบอ่านอย่างเดียว: ชื่อด้านซ้าย ค่าด้านขวา (กดค้างที่ค่าเพื่อคัดลอกได้)
 * ไม่ใช้ ListItem เพราะค่าของ ListItem คัดลอกไม่ได้ และช่อง right ไม่หดตาม
 * ค่ายาวอย่าง URL จะขึ้นบรรทัดใหม่แทนการล้นจอ
 */
export function InfoRow({ label, value, testID }: InfoRowProps) {
  const styles = useStyles();

  return (
    <View
      testID={testID}
      accessible
      accessibilityLabel={`${label}, ${value}`}
      className="flex-row items-center"
      style={styles.row}
    >
      <Text style={styles.label}>{label}</Text>
      <Text
        variant="bodySmall"
        color="textSecondary"
        align="right"
        selectable
        style={styles.value}
      >
        {value}
      </Text>
    </View>
  );
}

const useStyles = makeStyles(theme => ({
  row: {
    minHeight: theme.sizes.buttonLg,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    gap: theme.spacing.md,
  },
  // ชื่อแถวสั้นเสมอ แต่กันไว้ไม่ให้เบียดค่าจนเหลือไม่ถึงครึ่ง
  label: {
    flexShrink: 0,
    maxWidth: '55%',
  },
  value: {
    flex: 1,
  },
}));
