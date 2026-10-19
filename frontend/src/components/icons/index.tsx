import React from 'react';
import {
  Trophy,
  Plus,
  PlusCircle,
  Calendar,
  MapPin,
  Pencil,
  Trash2,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Medal,
  CheckCircle,
  CheckCircle2,
  ExternalLink,
  Eye,
  Search,
  Handshake,
  HeartHandshake,
  Building2,
  RotateCcw,
  Users,
  User,
  Phone,
  Mail,
  Shield,
  ShieldAlert,
  Clock,
  Receipt,
  Tag,
  Filter,
  Swords,
  LayoutGrid,
  Table as LucideTable,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  ArrowRight,
  X,
  AlertCircle,
  Award,
  Sparkles,
  Shirt,
  Bell,
  FileText,
  LayoutDashboard,
  Settings,
  LucideIcon,
  LucideProps,
} from 'lucide-react';

export interface IconProps extends Omit<LucideProps, 'ref'> {
  size?: number | string;
  color?: string;
  strokeWidth?: number;
  className?: string;
}

const createIcon = (Component: LucideIcon, defaultSize: number = 16) => {
  const IconComponent: React.FC<IconProps> = ({
    size = defaultSize,
    color = 'currentColor',
    strokeWidth = 2,
    className,
    ...props
  }) => {
    return (
      <Component
        size={size}
        color={color}
        strokeWidth={strokeWidth}
        className={className}
        {...props}
      />
    );
  };
  IconComponent.displayName = Component.displayName || 'Icon';
  return IconComponent;
};

// Sports & Portal Specific Semantic Icons
export const TrophyIcon = createIcon(Trophy, 16);
export const MedalIcon = createIcon(Medal, 16);
export const AwardIcon = createIcon(Award, 16);
export const SwordsIcon = createIcon(Swords, 16);
export const MatchIcon = createIcon(Swords, 16);
export const ShieldIcon = createIcon(Shield, 16);
export const TeamIcon = createIcon(Shield, 16);
export const ShieldAlertIcon = createIcon(ShieldAlert, 16);
export const UsersIcon = createIcon(Users, 16);
export const PlayersIcon = createIcon(Users, 16);
export const UserIcon = createIcon(User, 16);
export const PlayerIcon = createIcon(User, 16);
export const ShirtIcon = createIcon(Shirt, 16);
export const JerseyIcon = createIcon(Shirt, 16);

// Actions & Navigation Icons
export const PlusIcon = createIcon(Plus, 15);
export const PlusCircleIcon = createIcon(PlusCircle, 16);
export const PencilIcon = createIcon(Pencil, 13);
export const EditIcon = createIcon(Pencil, 13);
export const TrashIcon = createIcon(Trash2, 13);
export const DeleteIcon = createIcon(Trash2, 13);
export const EyeIcon = createIcon(Eye, 13);
export const SearchIcon = createIcon(Search, 14);
export const ExternalLinkIcon = createIcon(ExternalLink, 11);
export const ChevronLeftIcon = createIcon(ChevronLeft, 14);
export const ChevronRightIcon = createIcon(ChevronRight, 14);
export const ArrowLeftIcon = createIcon(ArrowLeft, 16);
export const BackIcon = ArrowLeftIcon;
export const ArrowRightIcon = createIcon(ArrowRight, 16);
export const CloseIcon = createIcon(X, 16);
export const XIcon = createIcon(X, 16);

// Layout & View Switcher Icons
export const TableIcon = createIcon(LucideTable, 14);
export const GridIcon = createIcon(LayoutGrid, 14);
export const LayoutGridIcon = createIcon(LayoutGrid, 14);
export const DashboardIcon = createIcon(LayoutDashboard, 16);
export const LayoutDashboardIcon = createIcon(LayoutDashboard, 16);
export const SettingsIcon = createIcon(Settings, 16);

// Financial, Sponsor & Ledger Icons
export const DollarIcon = createIcon(DollarSign, 16);
export const MoneyIcon = createIcon(DollarSign, 16);
export const ReceiptIcon = createIcon(Receipt, 16);
export const ExpenseIcon = createIcon(Receipt, 16);
export const HandshakeIcon = createIcon(Handshake, 16);
export const SponsorIcon = createIcon(Handshake, 16);
export const HeartHandshakeIcon = createIcon(HeartHandshake, 16);
export const BuildingIcon = createIcon(Building2, 14);
export const RotateCcwIcon = createIcon(RotateCcw, 14);
export const PayoutIcon = createIcon(RotateCcw, 14);
export const TrendingUpIcon = createIcon(TrendingUp, 16);
export const TrendingDownIcon = createIcon(TrendingDown, 16);

// Meta, Details & Status Icons
export const CalendarIcon = createIcon(Calendar, 14);
export const MapPinIcon = createIcon(MapPin, 14);
export const ClockIcon = createIcon(Clock, 14);
export const PhoneIcon = createIcon(Phone, 13);
export const MailIcon = createIcon(Mail, 13);
export const BellIcon = createIcon(Bell, 16);
export const FileTextIcon = createIcon(FileText, 16);
export const TagIcon = createIcon(Tag, 14);
export const FilterIcon = createIcon(Filter, 14);
export const SparklesIcon = createIcon(Sparkles, 14);
export const CheckIcon = createIcon(CheckCircle, 14);
export const CheckCircleIcon = createIcon(CheckCircle2, 14);
export const AlertCircleIcon = createIcon(AlertCircle, 14);
export const WarningIcon = createIcon(AlertCircle, 14);

// Dynamic Registry for <Icon name="..." />
const iconRegistry: Record<string, React.FC<IconProps>> = {
  trophy: TrophyIcon,
  medal: MedalIcon,
  award: AwardIcon,
  swords: SwordsIcon,
  match: MatchIcon,
  shield: ShieldIcon,
  team: TeamIcon,
  shieldAlert: ShieldAlertIcon,
  users: UsersIcon,
  players: PlayersIcon,
  user: UserIcon,
  player: PlayerIcon,
  shirt: ShirtIcon,
  jersey: JerseyIcon,
  plus: PlusIcon,
  plusCircle: PlusCircleIcon,
  pencil: PencilIcon,
  edit: EditIcon,
  trash: TrashIcon,
  delete: DeleteIcon,
  eye: EyeIcon,
  search: SearchIcon,
  externalLink: ExternalLinkIcon,
  chevronLeft: ChevronLeftIcon,
  chevronRight: ChevronRightIcon,
  arrowLeft: ArrowLeftIcon,
  back: BackIcon,
  arrowRight: ArrowRightIcon,
  close: CloseIcon,
  x: XIcon,
  table: TableIcon,
  grid: GridIcon,
  layoutGrid: LayoutGridIcon,
  dashboard: DashboardIcon,
  settings: SettingsIcon,
  dollar: DollarIcon,
  money: MoneyIcon,
  receipt: ReceiptIcon,
  expense: ExpenseIcon,
  handshake: HandshakeIcon,
  sponsor: SponsorIcon,
  heartHandshake: HeartHandshakeIcon,
  building: BuildingIcon,
  rotateCcw: RotateCcwIcon,
  payout: PayoutIcon,
  trendingUp: TrendingUpIcon,
  trendingDown: TrendingDownIcon,
  calendar: CalendarIcon,
  mapPin: MapPinIcon,
  clock: ClockIcon,
  phone: PhoneIcon,
  mail: MailIcon,
  bell: BellIcon,
  fileText: FileTextIcon,
  tag: TagIcon,
  filter: FilterIcon,
  sparkles: SparklesIcon,
  check: CheckIcon,
  checkCircle: CheckCircleIcon,
  alertCircle: AlertCircleIcon,
  warning: WarningIcon,
};

export interface DynamicIconProps extends IconProps {
  name: string;
}

export const Icon: React.FC<DynamicIconProps> = ({ name, ...props }) => {
  const Component = iconRegistry[name];
  if (!Component) {
    console.warn(`[Icon] Unknown icon name: "${name}"`);
    return null;
  }
  return <Component {...props} />;
};

// Lucide-compatible direct alias exports to allow seamless drop-in imports
export {
  TrophyIcon as Trophy,
  PlusIcon as Plus,
  PlusCircleIcon as PlusCircle,
  CalendarIcon as Calendar,
  MapPinIcon as MapPin,
  PencilIcon as Pencil,
  TrashIcon as Trash2,
  TrendingUpIcon as TrendingUp,
  TrendingDownIcon as TrendingDown,
  DollarIcon as DollarSign,
  MedalIcon as Medal,
  CheckIcon as Check,
  CheckCircleIcon as CheckCircle,
  CheckCircleIcon as CheckCircle2,
  ExternalLinkIcon as ExternalLink,
  EyeIcon as Eye,
  SearchIcon as Search,
  HandshakeIcon as Handshake,
  HeartHandshakeIcon as HeartHandshake,
  BuildingIcon as Building2,
  RotateCcwIcon as RotateCcw,
  UsersIcon as Users,
  UserIcon as User,
  PhoneIcon as Phone,
  MailIcon as Mail,
  ShieldIcon as Shield,
  ShieldAlertIcon as ShieldAlert,
  ClockIcon as Clock,
  ReceiptIcon as Receipt,
  TagIcon as Tag,
  FilterIcon as Filter,
  SwordsIcon as Swords,
  ChevronLeftIcon as ChevronLeft,
  ChevronRightIcon as ChevronRight,
  ArrowLeftIcon as ArrowLeft,
  ArrowRightIcon as ArrowRight,
  CloseIcon as X,
  AlertCircleIcon as AlertCircle,
  AwardIcon as Award,
  SparklesIcon as Sparkles,
  ShirtIcon as Shirt,
  BellIcon as Bell,
  FileTextIcon as FileText,
  DashboardIcon as LayoutDashboard,
  SettingsIcon as Settings,
};

