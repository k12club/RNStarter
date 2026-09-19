/**
 * รันตอน git commit (ผ่าน husky pre-commit)
 * tsc เขียนเป็น function เพื่อให้รันครั้งเดียวทั้งโปรเจกต์ ไม่ใช่ทีละไฟล์
 */
export default {
  '*.{js,jsx,ts,tsx}': ['eslint --fix --max-warnings=0', 'prettier --write'],
  '*.{json,md,yml,yaml}': 'prettier --write',
  '*.{ts,tsx}': () => 'tsc -p tsconfig.json --noEmit',
};
