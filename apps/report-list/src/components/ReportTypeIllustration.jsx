import conversations from '../assets/report-type-art/conversations.svg?url'
import creatorDiscovery from '../assets/report-type-art/creator-discovery.svg?url'
import engagement from '../assets/report-type-art/engagement.svg?url'
import fanPage from '../assets/report-type-art/fan-page.svg?url'
import followerGrowth from '../assets/report-type-art/follower-growth.svg?url'
import overlap from '../assets/report-type-art/overlap.svg?url'
import popularity from '../assets/report-type-art/popularity.svg?url'
import profileAttributes from '../assets/report-type-art/profile-attributes.svg?url'
import uploadAudience from '../assets/report-type-art/upload-audience.svg?url'

const REPORT_TYPE_ART = {
  'by-audience-attributes': profileAttributes,
  'by-conversation': conversations,
  'by-upload': uploadAudience,
  'by-account-profile': profileAttributes,
  'by-creator-discovery': creatorDiscovery,
  'by-popularity': popularity,
  'by-overlap': overlap,
  'by-custom-audience': uploadAudience,
  'by-engagement': engagement,
  'by-follower-growth': followerGrowth,
  'by-fan-page': fanPage,
  /** Never use the help-row avatar / “Visit the guide” artwork here. */
  'by-freeform-input': creatorDiscovery,
}

export default function ReportTypeIllustration({ typeId }) {
  const src = REPORT_TYPE_ART[typeId] ?? profileAttributes
  return (
    <img
      className="new-report-page__card-art-img"
      src={src}
      alt=""
      loading="lazy"
      decoding="async"
    />
  )
}
