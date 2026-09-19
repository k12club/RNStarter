import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import {
  Accordion,
  Avatar,
  Badge,
  Card,
  Divider,
  ListItem,
  Section,
  Switch,
  Text,
} from '@/components/ui';
import { useToast } from '@/components/ui/ToastProvider';
import { DemoGroup, DemoLabel } from '@/features/gallery/components/DemoGroup';
import { THAI_SAMPLE_NAME } from '@/features/gallery/constants';
import { LANGUAGE_LABELS } from '@/i18n/languages';
import { useTheme } from '@/theme';

/** Divider: เส้นเต็ม, inset, มีข้อความ, แนวตั้ง */
export function DividerDemo() {
  const { t } = useTranslation('gallery');

  return (
    <DemoGroup title={t('display.divider.title')}>
      <View>
        <DemoLabel>default</DemoLabel>
        <Divider spacing="md" />
        <DemoLabel>inset=xxl</DemoLabel>
        <Divider inset="xxl" spacing="md" />
        <DemoLabel>label</DemoLabel>
        <Divider label={t('display.divider.or')} spacing="md" />
        <DemoLabel>vertical</DemoLabel>
        <View className="h-11 flex-row items-center">
          <Text>{t('display.divider.left')}</Text>
          <Divider vertical spacing="md" />
          <Text>{t('display.divider.right')}</Text>
        </View>
      </View>
    </DemoGroup>
  );
}

/** ListItem ทุกรูปแบบในการ์ดเดียว คั่นด้วย Divider แบบ inset ให้ตรงข้อความ */
export function ListItemsDemo() {
  const { t, i18n } = useTranslation('gallery');
  const theme = useTheme();
  const toastApi = useToast();
  const [notify, setNotify] = useState(true);
  // เส้นคั่นเริ่มตรงข้อความ: padding ซ้าย + icon md + ระยะห่าง
  const textInset = theme.spacing.lg + theme.sizes.icon.md + theme.spacing.md;
  const language = i18n.resolvedLanguage === 'en' ? 'en' : 'th';

  return (
    <DemoGroup title={t('display.list.title')} padding="none">
      <ListItem title={t('display.list.plain')} />
      <Divider inset="lg" />
      <ListItem
        left="map-pin"
        title={t('display.list.address')}
        subtitle={t('display.list.addressDetail')}
      />
      <Divider inset={textInset} />
      <ListItem
        left={<Avatar size="sm" name={THAI_SAMPLE_NAME} />}
        title={THAI_SAMPLE_NAME}
        subtitle={t('display.list.member')}
        right={
          <Badge label={t('display.list.gold')} status="warning" size="sm" />
        }
      />
      <Divider inset={textInset} />
      <ListItem
        left="languages"
        title={t('display.list.language')}
        value={LANGUAGE_LABELS[language]}
        chevron
        onPress={() => toastApi.info(t('display.list.language'))}
      />
      <Divider inset={textInset} />
      <ListItem
        left="bell"
        title={t('display.list.notifications')}
        right={
          <Switch
            value={notify}
            onValueChange={setNotify}
            accessibilityLabel={t('display.list.notifications')}
          />
        }
      />
      <Divider inset={textInset} />
      <ListItem
        left="lock"
        title={t('display.list.locked')}
        subtitle={t('display.list.lockedDetail')}
        chevron
        disabled
        onPress={() => undefined}
      />
      <Divider inset={textInset} />
      <ListItem
        left="file-text"
        title={t('display.list.longTitle')}
        subtitle={t('display.list.longSubtitle')}
      />
      <Divider inset={textInset} />
      <ListItem
        left="trash"
        title={t('display.list.deleteAccount')}
        destructive
        onPress={() => toastApi.warning(t('display.list.deleteAccount'))}
      />
    </DemoGroup>
  );
}

/** Section (หัวข้อ + ลิงก์ด้านขวา) และ Accordion */
export function SectionAccordionDemo() {
  const { t } = useTranslation(['gallery', 'common']);
  const toastApi = useToast();

  return (
    <>
      <DemoGroup title={t('gallery:display.section.title')}>
        <Section
          title={t('gallery:display.section.sample')}
          description={t('gallery:display.section.sampleDescription')}
          actionLabel={t('common:seeAll')}
          onAction={() => toastApi.info(t('common:seeAll'))}
        >
          <Card elevation="none" bordered>
            <Text>{t('gallery:display.section.body')}</Text>
          </Card>
        </Section>
      </DemoGroup>

      <DemoGroup title={t('gallery:display.accordion.title')} padding="none">
        <Accordion
          icon="circle-help"
          title={t('gallery:display.accordion.q1')}
          defaultExpanded
        >
          <Text color="textSecondary">{t('gallery:display.accordion.a1')}</Text>
        </Accordion>
        <Divider />
        <Accordion
          icon="credit-card"
          title={t('gallery:display.accordion.q2')}
          subtitle={t('gallery:display.accordion.q2Subtitle')}
        >
          <Text color="textSecondary">{t('gallery:display.accordion.a2')}</Text>
        </Accordion>
        <Divider />
        <Accordion
          icon="lock"
          title={t('gallery:display.accordion.disabled')}
          disabled
        />
      </DemoGroup>
    </>
  );
}
