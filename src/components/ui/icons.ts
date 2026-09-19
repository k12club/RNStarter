/**
 * Icon ที่แอปใช้ (lucide-react-native) — import ทีละไฟล์เพื่อไม่ให้ bundle ใหญ่ (Metro ไม่ tree-shake)
 * เพิ่ม icon: หาชื่อที่ https://lucide.dev/icons แล้วเพิ่มบรรทัด import + key ใน `icons`
 * ห้าม import จาก 'lucide-react-native' ตรง ๆ (ESLint จะเตือน)
 */
import ArrowLeft from 'lucide-react-native/icons/arrow-left';
import ArrowRight from 'lucide-react-native/icons/arrow-right';
import Bell from 'lucide-react-native/icons/bell';
import Calendar from 'lucide-react-native/icons/calendar';
import Camera from 'lucide-react-native/icons/camera';
import Check from 'lucide-react-native/icons/check';
import ChevronDown from 'lucide-react-native/icons/chevron-down';
import ChevronLeft from 'lucide-react-native/icons/chevron-left';
import ChevronRight from 'lucide-react-native/icons/chevron-right';
import ChevronUp from 'lucide-react-native/icons/chevron-up';
import CircleAlert from 'lucide-react-native/icons/circle-alert';
import CircleCheck from 'lucide-react-native/icons/circle-check';
import CircleHelp from 'lucide-react-native/icons/circle-question-mark';
import CircleUser from 'lucide-react-native/icons/circle-user';
import CircleX from 'lucide-react-native/icons/circle-x';
import Clock from 'lucide-react-native/icons/clock';
import Copy from 'lucide-react-native/icons/copy';
import CreditCard from 'lucide-react-native/icons/credit-card';
import Download from 'lucide-react-native/icons/download';
import Ellipsis from 'lucide-react-native/icons/ellipsis';
import EllipsisVertical from 'lucide-react-native/icons/ellipsis-vertical';
import ExternalLink from 'lucide-react-native/icons/external-link';
import Eye from 'lucide-react-native/icons/eye';
import EyeOff from 'lucide-react-native/icons/eye-off';
import FileText from 'lucide-react-native/icons/file-text';
import Funnel from 'lucide-react-native/icons/funnel';
import Gift from 'lucide-react-native/icons/gift';
import Globe from 'lucide-react-native/icons/globe';
import Heart from 'lucide-react-native/icons/heart';
import House from 'lucide-react-native/icons/house';
import Image from 'lucide-react-native/icons/image';
import Inbox from 'lucide-react-native/icons/inbox';
import Info from 'lucide-react-native/icons/info';
import Languages from 'lucide-react-native/icons/languages';
import LayoutGrid from 'lucide-react-native/icons/layout-grid';
import ListFilter from 'lucide-react-native/icons/list-filter';
import Lock from 'lucide-react-native/icons/lock';
import LogIn from 'lucide-react-native/icons/log-in';
import LogOut from 'lucide-react-native/icons/log-out';
import Mail from 'lucide-react-native/icons/mail';
import MapPin from 'lucide-react-native/icons/map-pin';
import Menu from 'lucide-react-native/icons/menu';
import MessageCircle from 'lucide-react-native/icons/message-circle';
import Minus from 'lucide-react-native/icons/minus';
import Moon from 'lucide-react-native/icons/moon';
import Package from 'lucide-react-native/icons/package';
import Palette from 'lucide-react-native/icons/palette';
import Pencil from 'lucide-react-native/icons/pencil';
import Phone from 'lucide-react-native/icons/phone';
import Plus from 'lucide-react-native/icons/plus';
import QrCode from 'lucide-react-native/icons/qr-code';
import RefreshCw from 'lucide-react-native/icons/refresh-cw';
import Search from 'lucide-react-native/icons/search';
import Settings from 'lucide-react-native/icons/settings';
import Share from 'lucide-react-native/icons/share';
import ShieldCheck from 'lucide-react-native/icons/shield-check';
import ShoppingBag from 'lucide-react-native/icons/shopping-bag';
import ShoppingCart from 'lucide-react-native/icons/shopping-cart';
import SlidersHorizontal from 'lucide-react-native/icons/sliders-horizontal';
import Smartphone from 'lucide-react-native/icons/smartphone';
import Star from 'lucide-react-native/icons/star';
import Sun from 'lucide-react-native/icons/sun';
import Tag from 'lucide-react-native/icons/tag';
import Trash from 'lucide-react-native/icons/trash';
import Upload from 'lucide-react-native/icons/upload';
import User from 'lucide-react-native/icons/user';
import Wallet from 'lucide-react-native/icons/wallet';
import WifiOff from 'lucide-react-native/icons/wifi-off';
import X from 'lucide-react-native/icons/x';

export const icons = {
  'arrow-left': ArrowLeft,
  'arrow-right': ArrowRight,
  bell: Bell,
  calendar: Calendar,
  camera: Camera,
  check: Check,
  'chevron-down': ChevronDown,
  'chevron-left': ChevronLeft,
  'chevron-right': ChevronRight,
  'chevron-up': ChevronUp,
  'circle-alert': CircleAlert,
  'circle-check': CircleCheck,
  'circle-help': CircleHelp,
  'circle-user': CircleUser,
  'circle-x': CircleX,
  clock: Clock,
  copy: Copy,
  'credit-card': CreditCard,
  download: Download,
  ellipsis: Ellipsis,
  'ellipsis-vertical': EllipsisVertical,
  'external-link': ExternalLink,
  eye: Eye,
  'eye-off': EyeOff,
  'file-text': FileText,
  funnel: Funnel,
  gift: Gift,
  globe: Globe,
  heart: Heart,
  house: House,
  image: Image,
  inbox: Inbox,
  info: Info,
  languages: Languages,
  'layout-grid': LayoutGrid,
  'list-filter': ListFilter,
  lock: Lock,
  'log-in': LogIn,
  'log-out': LogOut,
  mail: Mail,
  'map-pin': MapPin,
  menu: Menu,
  'message-circle': MessageCircle,
  minus: Minus,
  moon: Moon,
  package: Package,
  palette: Palette,
  pencil: Pencil,
  phone: Phone,
  plus: Plus,
  'qr-code': QrCode,
  'refresh-cw': RefreshCw,
  search: Search,
  settings: Settings,
  share: Share,
  'shield-check': ShieldCheck,
  'shopping-bag': ShoppingBag,
  'shopping-cart': ShoppingCart,
  'sliders-horizontal': SlidersHorizontal,
  smartphone: Smartphone,
  star: Star,
  sun: Sun,
  tag: Tag,
  trash: Trash,
  upload: Upload,
  user: User,
  wallet: Wallet,
  'wifi-off': WifiOff,
  x: X,
} as const;

export type IconName = keyof typeof icons;
