/** Synthetic taxonomy nodes: zero items, used to demo insufficient-signal UX. */

const SPECS = {
  'brands-relationship': {
    id: 'brands-relationship-insufficient-signal',
    title: 'Emerging segments',
    eyebrow: 'Insufficient signal for ranking',
  },
  media: {
    id: 'media-insufficient-signal',
    title: 'Emerging formats',
    eyebrow: 'Insufficient signal for ranking',
  },
  influence: {
    id: 'influence-insufficient-signal',
    title: 'Emerging talent pools',
    eyebrow: 'Insufficient signal for ranking',
  },
}

/** @param {{ insufficientSignal?: boolean }} cat */
export function isInsufficientSignalCategory(cat) {
  return Boolean(cat?.insufficientSignal)
}

/**
 * @param {string} domainId
 * @param {string} categoryId
 */
export function isInsufficientSignalCategoryId(domainId, categoryId) {
  const spec = SPECS[domainId]
  return spec?.id === categoryId
}

/**
 * @param {import('../data/audienceData.js').DOMAINS[0]} domain
 */
export function appendInsufficientSignalCategory(domain) {
  const spec = SPECS[domain.id]
  if (!spec) return domain
  if (domain.categories.some((c) => c.id === spec.id)) return domain

  const domainLabel =
    domain.id === 'brands-relationship'
      ? 'Brands'
      : domain.id === 'media'
        ? 'Media'
        : 'Influencers'

  return {
    ...domain,
    categories: [
      ...domain.categories,
      {
        id: spec.id,
        title: spec.title,
        breadcrumb: `${domainLabel} > ${spec.title}`,
        items: [],
        insufficientSignal: true,
      },
    ],
  }
}
