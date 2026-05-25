import { IconLayers } from 'nucleo-social-media'
import facebookLogo from '../assets/source-logos/facebook.png'
import googleLogo from '../assets/source-logos/google.png'
import instagramLogo from '../assets/source-logos/instagram.png'
import linkedinLogo from '../assets/source-logos/linkedin.png'
import metaLogo from '../assets/source-logos/meta.png'
import multiNetworkLogo from '../assets/source-logos/multi-network.png'
import pinterestLogo from '../assets/source-logos/pinterest.png'
import threadsLogo from '../assets/source-logos/threads.png'
import tiktokLogo from '../assets/source-logos/tiktok.png'
import twitchLogo from '../assets/source-logos/twitch.png'
import xLogo from '../assets/source-logos/x.png'
import youtubeLogo from '../assets/source-logos/youtube.png'

/**
 * App-icon style PNGs (rounded squares) for every supported data source.
 * The PNGs already include their own brand color + rounded corners, so the
 * wrapper should NOT clip them to a circle.
 */
const SOURCE_LOGO_SRC = {
  x: xLogo,
  facebook: facebookLogo,
  instagram: instagramLogo,
  threads: threadsLogo,
  linkedin: linkedinLogo,
  tiktok: tiktokLogo,
  youtube: youtubeLogo,
  meta: metaLogo,
  google: googleLogo,
  'multi-network': multiNetworkLogo,
  twitch: twitchLogo,
  pinterest: pinterestLogo,
}

export default function SourceBrandMark({ sourceId, size = 16, className }) {
  const src = SOURCE_LOGO_SRC[sourceId]
  if (src) {
    return (
      <img
        src={src}
        width={size}
        height={size}
        alt=""
        loading="lazy"
        decoding="async"
        draggable={false}
        className={className}
        style={{ display: 'block', width: size, height: size }}
      />
    )
  }
  return <IconLayers size={size} className={className} />
}
