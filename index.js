/**
 * @format
 */

// ต้องเป็นบรรทัดแรก: Hermes ไม่มี Intl.PluralRules (i18next ใช้เลือกรูปพหูพจน์)
import 'intl-pluralrules';

import { AppRegistry } from 'react-native';

import { name as appName } from './app.json';
import App from './src/app/App';

AppRegistry.registerComponent(appName, () => App);
