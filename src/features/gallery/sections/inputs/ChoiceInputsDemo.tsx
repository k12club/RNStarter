import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import {
  Checkbox,
  RadioGroup,
  type RadioOption,
  SegmentedControl,
  type SegmentedOption,
  Switch,
} from '@/components/ui';
import { DemoGroup, DemoLabel } from '@/features/gallery/components/DemoGroup';

const TOPICS = ['orders', 'promotions', 'news'] as const;
type Topic = (typeof TOPICS)[number];

const SHIPPING = ['standard', 'express', 'pickup'] as const;
type Shipping = (typeof SHIPPING)[number];

const PERIODS = ['day', 'week', 'month', 'year'] as const;
type Period = (typeof PERIODS)[number];

const VIEW_MODES = ['list', 'grid'] as const;
type ViewMode = (typeof VIEW_MODES)[number];

/** Checkbox (รวม indeterminate), RadioGroup, Switch, SegmentedControl */
export function ChoiceInputsDemo() {
  const { t } = useTranslation('gallery');
  const [topics, setTopics] = useState<ReadonlySet<Topic>>(
    () => new Set<Topic>(['orders']),
  );
  const [terms, setTerms] = useState(false);
  const [shipping, setShipping] = useState<Shipping>('standard');
  const [push, setPush] = useState(true);
  const [dataSaver, setDataSaver] = useState(false);
  const [period, setPeriod] = useState<Period>('week');
  const [viewMode, setViewMode] = useState<ViewMode>('list');

  const allChecked = topics.size === TOPICS.length;
  const someChecked = topics.size > 0 && !allChecked;

  const toggleTopic = (topic: Topic, checked: boolean) => {
    setTopics(current => {
      const next = new Set(current);
      if (checked) {
        next.add(topic);
      } else {
        next.delete(topic);
      }
      return next;
    });
  };

  const shippingOptions = useMemo<ReadonlyArray<RadioOption<Shipping>>>(
    () =>
      SHIPPING.map(value => ({
        value,
        label: t(`inputs.shipping.${value}.label`),
        description: t(`inputs.shipping.${value}.description`),
        // รับที่ร้านปิดไว้เพื่อแสดงตัวเลือกที่กดไม่ได้
        disabled: value === 'pickup',
      })),
    [t],
  );

  const periodOptions = useMemo<ReadonlyArray<SegmentedOption<Period>>>(
    () =>
      PERIODS.map(value => ({ value, label: t(`inputs.periods.${value}`) })),
    [t],
  );

  const viewModeOptions = useMemo<ReadonlyArray<SegmentedOption<ViewMode>>>(
    () =>
      VIEW_MODES.map(value => ({
        value,
        label: t(`inputs.viewModes.${value}`),
      })),
    [t],
  );

  return (
    <>
      <DemoGroup title="Checkbox">
        <View>
          <Checkbox
            label={t('inputs.topicsAll')}
            checked={allChecked}
            indeterminate={someChecked}
            onChange={checked =>
              setTopics(checked ? new Set(TOPICS) : new Set<Topic>())
            }
          />
          <View className="pl-8">
            {TOPICS.map(topic => (
              <Checkbox
                key={topic}
                label={t(`inputs.topics.${topic}`)}
                checked={topics.has(topic)}
                onChange={checked => toggleTopic(topic, checked)}
              />
            ))}
          </View>
          <Checkbox
            label={t('inputs.terms')}
            description={t('inputs.termsDescription')}
            checked={terms}
            onChange={setTerms}
            errorText={terms ? undefined : t('inputs.termsError')}
          />
          <Checkbox
            label={t('inputs.checkedDisabled')}
            checked
            disabled
            onChange={() => undefined}
          />
          <Checkbox
            label={t('inputs.uncheckedDisabled')}
            checked={false}
            disabled
            onChange={() => undefined}
          />
        </View>
      </DemoGroup>

      <DemoGroup title="RadioGroup">
        <RadioGroup
          label={t('inputs.shippingLabel')}
          options={shippingOptions}
          value={shipping}
          onChange={setShipping}
        />
      </DemoGroup>

      <DemoGroup title="Switch">
        <View className="gap-2">
          <Switch
            label={t('inputs.push')}
            description={t('inputs.pushDescription')}
            value={push}
            onValueChange={setPush}
          />
          <Switch
            label={t('inputs.syncDisabled')}
            value
            onValueChange={() => undefined}
            disabled
          />
          <DemoLabel>{t('inputs.switchBare')}</DemoLabel>
          <Switch
            accessibilityLabel={t('inputs.dataSaver')}
            value={dataSaver}
            onValueChange={setDataSaver}
          />
        </View>
      </DemoGroup>

      <DemoGroup title="SegmentedControl">
        <View className="gap-4">
          <SegmentedControl
            accessibilityLabel={t('inputs.periodLabel')}
            options={periodOptions}
            value={period}
            onChange={setPeriod}
          />
          <SegmentedControl
            accessibilityLabel={t('inputs.viewModeLabel')}
            options={viewModeOptions}
            value={viewMode}
            onChange={setViewMode}
          />
          <DemoLabel>disabled</DemoLabel>
          <SegmentedControl
            accessibilityLabel={t('inputs.periodLabel')}
            options={periodOptions}
            value="month"
            onChange={() => undefined}
            disabled
          />
        </View>
      </DemoGroup>
    </>
  );
}
