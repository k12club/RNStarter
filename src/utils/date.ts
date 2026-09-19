import dayjs from 'dayjs';
import 'dayjs/locale/th';
import buddhistEra from 'dayjs/plugin/buddhistEra';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import localizedFormat from 'dayjs/plugin/localizedFormat';
import relativeTime from 'dayjs/plugin/relativeTime';
import updateLocale from 'dayjs/plugin/updateLocale';

/**
 * dayjs ที่ตั้งค่า plugin แล้ว ให้ import จากไฟล์นี้เสมอ (ไม่ import 'dayjs' ตรง ๆ)
 * ภาษาถูกสลับอัตโนมัติตาม i18n (ดู src/i18n/index.ts)
 *
 * - ต้อง extend buddhistEra ก่อน localizedFormat ไม่งั้น BBBB ใน L / LL จะไม่ถูกแปลง
 * - locale th ของ dayjs ใช้ปี ค.ศ. ใน L / LL จึง override ให้เป็น พ.ศ.
 * - buddhistEra ใช้ได้กับการแสดงผลเท่านั้น ถ้า parse ปี พ.ศ. ต้องลบ 543 เอง
 * - Hermes ไม่มี Intl.RelativeTimeFormat จึงใช้ relativeTime ของ dayjs แทน
 */
dayjs.extend(buddhistEra);
dayjs.extend(localizedFormat);
dayjs.extend(customParseFormat);
dayjs.extend(relativeTime);
dayjs.extend(updateLocale);

dayjs.updateLocale('th', {
  formats: {
    LT: 'H:mm',
    LTS: 'H:mm:ss',
    L: 'DD/MM/BBBB',
    LL: 'D MMMM BBBB',
    LLL: 'D MMMM BBBB เวลา H:mm',
    LLLL: 'วันddddที่ D MMMM BBBB เวลา H:mm',
  },
});

export default dayjs;
