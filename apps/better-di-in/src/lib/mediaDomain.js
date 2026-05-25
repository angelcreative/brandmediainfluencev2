export const MEDIA_DOMAIN_ID = 'media'

/** Same pattern as brands: strip Criterion trailing disambiguators from outlet labels. */
function stripTrailingMediaParentheticals(name) {
  let s = String(name || '').trim()
  let prev = null
  while (prev !== s) {
    prev = s
    s = s.replace(/\s*\([^()]{0,200}\)\s*$/u, '').trim()
  }
  return s
}

/**
 * Press / TV rows use a generic bucket in `name` (Magazines, Newspapers,
 * TV Channels) and the concrete outlet in `subName`. Promote subName to
 * `name` and keep the bucket in `mediaGroupLabel` for the Category column.
 */
export function prepareMediaDomain(domain) {
  if (domain.id !== MEDIA_DOMAIN_ID) return domain

  return {
    ...domain,
    categories: domain.categories.map((cat) => ({
      ...cat,
      items: cat.items.map((item) => {
        const sub = item.subName?.trim()
        if (!sub) return item
        const bucket = item.name?.trim() || ''
        const display = stripTrailingMediaParentheticals(sub) || sub
        return {
          ...item,
          name: display,
          subName: '',
          mediaGroupLabel: bucket,
        }
      }),
    })),
  }
}
