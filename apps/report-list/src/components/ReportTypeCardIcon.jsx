import {
  Building2,
  Compass,
  Flag,
  GitMerge,
  Layers,
  MessageCircle,
  MousePointerClick,
  PenLine,
  TrendingUp,
  Upload,
  UserPlus,
  Users,
} from 'lucide-react'

const ICON_BY_TYPE = {
  'by-audience-attributes': Users,
  'by-conversation': MessageCircle,
  'by-upload': Upload,
  'by-account-profile': Building2,
  'by-creator-discovery': Compass,
  'by-popularity': TrendingUp,
  'by-overlap': GitMerge,
  'by-custom-audience': Layers,
  'by-engagement': MousePointerClick,
  'by-follower-growth': UserPlus,
  'by-fan-page': Flag,
  'by-freeform-input': PenLine,
}

export default function ReportTypeCardIcon({ typeId, size = 20 }) {
  const Icon = ICON_BY_TYPE[typeId] ?? Layers
  return <Icon size={size} strokeWidth={2} aria-hidden className="new-report-page__card-type-icon-svg" />
}
