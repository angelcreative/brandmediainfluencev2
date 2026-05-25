import SiMeta from '@icons-pack/react-simple-icons/icons/SiMeta.mjs'
import {
  IconFacebook,
  IconGoogle,
  IconLayers,
  IconLinkedin,
  IconThreads,
  IconTikTok,
  IconXTwitter,
  IconYoutube,
} from 'nucleo-social-media'
import InstagramGradientIcon from './InstagramGradientIcon.jsx'

/** Nucleo social icons + Instagram gradient; Meta stays SiMeta. */
const NUCLEO_BY_SOURCE = {
  x: IconXTwitter,
  facebook: IconFacebook,
  threads: IconThreads,
  linkedin: IconLinkedin,
  tiktok: IconTikTok,
  youtube: IconYoutube,
  google: IconGoogle,
}

export default function SourceBrandMark({ sourceId, size = 16, className }) {
  if (sourceId === 'meta') {
    return <SiMeta color="default" size={size} className={className} title="" />
  }
  if (sourceId === 'instagram') {
    return <InstagramGradientIcon size={size} className={className} />
  }
  const Cmp = NUCLEO_BY_SOURCE[sourceId]
  if (Cmp) {
    return <Cmp size={size} className={className} />
  }
  return <IconLayers size={size} className={className} />
}
