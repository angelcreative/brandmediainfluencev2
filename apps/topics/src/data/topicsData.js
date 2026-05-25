/* =============================================================
   Interests · mock dataset
   25 Interests (macro), ~150 Categories (micro). Generated
   deterministically from explicit seed strings so the demo is
   stable across reloads but feels "real" (spread of penetration
   / selectivity / curated vs Meta-native).

   Naming note (kept honest with Meta's domain language):
   · Macro level (rail tabs)  = "Interest"  e.g. "Mobility & vehicles"
   · Micro level (table rows) = "Category"  e.g. "Tesla", "EV charging networks"
   The file name (`topicsData.js`) is legacy; we keep it to avoid
   churning imports while the prototype is still moving.
   ============================================================= */

export const REPORT_META = {
  project: 'Sample project',
  audienceName: 'The EV Driver',
  audienceContext: 'The car fanatic',
  audienceSize: 599_800,
  baselineLabel: 'Belgium · Car owners',
  baselineSize: 25_400_000,
  updatedLabel: 'Updated May 2026',
}

/* Deterministic 32-bit hash → seeded PRNG (mulberry32).
   We need stable numbers for the prototype so screenshots /
   reviews don't shift between sessions. */
function hashStr(s) {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}
function mulberry32(seed) {
  let t = seed >>> 0
  return () => {
    t += 0x6D2B79F5
    let r = Math.imul(t ^ (t >>> 15), 1 | t)
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296
  }
}

/* Skewed selectivity sampler. We bias the distribution so:
   · most categories sit near baseline (0.7×–1.5×)
   · a long over-indexed tail produces the "differentiators"
   · a smaller under-indexed tail keeps the chart honest. */
function sampleSelectivity(rng) {
  const u = rng()
  if (u < 0.12) return 0.2 + rng() * 0.5           /* strongly under */
  if (u < 0.35) return 0.7 + rng() * 0.3           /* mildly under   */
  if (u < 0.65) return 1.0 + rng() * 0.2           /* neutral        */
  if (u < 0.88) return 1.2 + rng() * 0.9           /* mildly over    */
  return 2.1 + rng() * 2.6                          /* strongly over  */
}

/* Per-interest selectivity bias for the demo audience ("The EV
   Driver" in "The Car Fanatic" project). We multiply the seeded
   sample so the dataset tells a believable story: cars,
   sustainability and tech clearly over-index; lifestyle interests
   sit near baseline; beauty and pets are unexpected. Range
   roughly 0.4–3.0 so the underlying distribution shape stays
   intact. */
const INTEREST_SELECTIVITY_BIAS = {
  mobility: 2.6,
  sustainability: 2.3,
  tech: 1.7,
  travel: 1.35,
  business: 1.35,
  outdoors: 1.25,
  news: 1.2,
  learning: 1.15,
  health: 1.1,
  food: 1.0,
  music: 1.0,
  screen: 0.95,
  home: 0.95,
  diy: 0.95,
  sports: 0.95,
  culture: 0.9,
  family: 0.85,
  books: 0.85,
  causes: 0.85,
  gaming: 0.85,
  mindfulness: 0.85,
  style: 0.75,
  'parenting-care': 0.7,
  beauty: 0.6,
  pets: 0.55,
}

function sampleAudiencePen(rng) {
  /* Long-tail towards small penetration so the demo doesn't show
     every category at 50%+. */
  const u = rng()
  if (u < 0.6) return 0.5 + rng() * 6              /* 0.5%  – 6.5%   */
  if (u < 0.9) return 6 + rng() * 18               /* 6%    – 24%    */
  return 24 + rng() * 36                            /* 24%   – 60%    */
}

const META_SIGNAL_POOL = {
  interests: [
    'Electric vehicles', 'Plug-in hybrid vehicles', 'Tesla', 'BMW i', 'Polestar',
    'EV charging', 'Renewable energy', 'Solar power', 'Smart home', 'Sustainability',
    'Plant-based diet', 'Cycling', 'Yoga', 'Meditation', 'Wellness',
    'Skincare', 'Beauty', 'Designer brands', 'Streetwear', 'Sustainable fashion',
    'Specialty coffee', 'Wine', 'Craft beer', 'Cooking', 'Fine dining',
    'Long-haul travel', 'Eco tourism', 'City breaks', 'Road trips', 'Adventure travel',
    'Indie music', 'Electronic music', 'Podcasts', 'Live concerts',
    'Documentaries', 'Sci-fi films', 'Streaming services',
    'Smartphones', 'Wearables', 'Artificial intelligence',
    'Investing', 'ESG investing', 'Personal finance',
    'Online learning', 'Languages',
    'Climate policy', 'Photography', 'Hiking', 'Camping',
  ],
  behaviors: [
    'Engaged shoppers (auto)', 'Owners of hybrid vehicles', 'New movers',
    'Frequent travellers', 'Premium credit card holders',
    'Engaged shoppers (fashion)', 'Engaged shoppers (beauty)',
    'Tech early adopters', 'Premium streaming subscribers',
    'Small business owners', 'Engaged donors',
  ],
  pages: [
    'Tesla', 'BMW', 'Polestar', 'Audi', 'Volvo', 'Greenpeace', 'WWF',
    'Spotify', 'Netflix', 'Apple Music', 'The New York Times', 'BBC',
    'Patagonia', 'IKEA', 'Decathlon', 'Lululemon', 'L\u2019Or\u00e9al',
  ],
}

function pickN(arr, n, rng) {
  const out = []
  const used = new Set()
  while (out.length < n && used.size < arr.length) {
    const i = Math.floor(rng() * arr.length)
    if (used.has(i)) continue
    used.add(i)
    out.push(arr[i])
  }
  return out
}

/* Source data — interest → list of category names + 1-line
   description. Names and copy are sentence-case (Titan rule).
   Categories are short noun phrases so they read well in a tight
   table cell. */
const RAW_INTERESTS = [
  {
    id: 'mobility',
    name: 'Mobility & vehicles',
    description: 'Cars, charging, alternative powertrains and personal mobility.',
    categories: [
      ['Electric vehicles', 'Audience engaging with EV models, charging infrastructure and the transition from combustion to electric mobility.', true],
      ['Plug-in hybrids', 'People researching plug-in hybrid models and total cost of ownership comparisons.', true],
      ['EV charging networks', 'Interest in public charging operators, home wallbox installation and fast-charging news.', true],
      ['Tesla', 'Fans, owners and watchers of the Tesla brand: product launches, Autopilot, gigafactory news.', false],
      ['Polestar', 'Audience tracking Polestar models, design and Scandinavian EV positioning.', false],
      ['Volvo', 'Volvo brand engagement: electrification roadmap, safety positioning, EX/EC line-up.', false],
      ['BMW i', 'BMW electric line followers (i4, iX, i7).', false],
      ['Hydrogen vehicles', 'Audience curious about hydrogen fuel-cell cars and their infrastructure outlook.', true],
      ['Car maintenance', 'DIY and pro maintenance, tyres, brakes, and EV-specific upkeep.', false],
      ['Road trips', 'Long-distance travel by car, route planning and EV trip-planning apps.', true],
      ['Motorsport', 'Formula 1, Formula E and rally enthusiasts.', false],
      ['Cycling commute', 'Audience commuting by bike, e-bike adoption and urban cycling infrastructure.', true],
    ],
  },
  {
    id: 'sustainability',
    name: 'Sustainability & ecology',
    description: 'Climate, renewable energy, ethical consumption and zero-waste lifestyles.',
    categories: [
      ['Renewable energy', 'Solar, wind, storage and the transition off fossil fuels.', true],
      ['Solar power at home', 'Homeowners installing rooftop solar and battery storage.', true],
      ['Climate policy', 'Audience tracking climate legislation, COP summits and carbon pricing.', true],
      ['Zero-waste lifestyle', 'Reducing single-use packaging, composting and refill culture.', true],
      ['Sustainable fashion', 'Ethical brands, recycled fibres, second-hand and rental wardrobes.', true],
      ['Conscious consumption', 'People considering impact of every purchase: provenance, certifications.', true],
      ['Greenpeace', 'Greenpeace supporters and campaign followers.', false],
      ['WWF', 'World Wildlife Fund supporters.', false],
      ['Electric mobility advocacy', 'Pro-EV community: policy push, charging deserts, ICE bans.', true],
    ],
  },
  {
    id: 'tech',
    name: 'Tech & gadgets',
    description: 'Consumer tech, smart home, wearables and AI.',
    categories: [
      ['Smart home', 'Home automation: lighting, climate, security, voice assistants.', true],
      ['Wearables', 'Smart watches, fitness trackers, sleep wearables.', false],
      ['Artificial intelligence', 'AI products, ChatGPT-class tools, on-device AI.', false],
      ['Productivity apps', 'Note-taking, task management, calendar power users.', false],
      ['Apple ecosystem', 'iPhone + Mac + Watch + AirPods integrated household.', false],
      ['Android enthusiasts', 'Custom ROMs, Pixel and Samsung Galaxy ecosystem.', false],
      ['Photography gear', 'Mirrorless cameras, lenses and post-production.', false],
      ['Home networking', 'Mesh Wi-Fi, NAS, self-hosted services.', true],
    ],
  },
  {
    id: 'health',
    name: 'Health & wellbeing',
    description: 'Physical, mental and preventive health.',
    categories: [
      ['Yoga', 'Yoga practice, online classes, retreats.', false],
      ['Meditation', 'Mindfulness apps, breathing techniques, guided meditation.', false],
      ['Mental health', 'Therapy access, anxiety support, wellbeing at work.', true],
      ['Sleep optimisation', 'Tracking sleep, recovery, blue-light hygiene.', true],
      ['Nutrition', 'Macros, micronutrients, whole-food eating.', false],
      ['Functional medicine', 'Audience exploring root-cause and preventive medicine.', true],
      ['Running', 'Recreational and competitive runners.', false],
      ['Strength training', 'Gym goers, hypertrophy, mobility work.', false],
    ],
  },
  {
    id: 'food',
    name: 'Food & drink',
    description: 'Home cooking, dining, drinks and dietary identities.',
    categories: [
      ['Plant-based eating', 'Vegan and vegetarian audiences and flexitarians cutting meat.', true],
      ['Specialty coffee', 'Third-wave coffee: origins, brewing methods, baristas.', false],
      ['Natural wine', 'Low-intervention wines, biodynamic producers.', true],
      ['Craft beer', 'Independent breweries, taprooms, beer tourism.', false],
      ['Fine dining', 'Tasting menus, Michelin culture, chef following.', false],
      ['Home cooking', 'Audiences cooking from scratch, recipe-driven shopping.', false],
      ['Asian cuisine', 'Korean, Japanese, Thai, Vietnamese food enthusiasts.', false],
      ['Mediterranean diet', 'Olive oil, fish, vegetable-first eating patterns.', true],
    ],
  },
  {
    id: 'travel',
    name: 'Travel & adventure',
    description: 'Leisure travel, exploration and trip planning.',
    categories: [
      ['Eco tourism', 'Travellers prioritising low-impact destinations and operators.', true],
      ['City breaks', 'Short urban getaways across Europe.', false],
      ['Long-haul travel', 'Intercontinental travellers, business and leisure.', false],
      ['Adventure travel', 'Trekking, alpine, expedition-style trips.', false],
      ['Luxury travel', 'High-end resorts, suites, premium-cabin flying.', false],
      ['Slow travel', 'Train-first, multi-week travellers, deep destinations.', true],
      ['Skiing & snowboard', 'Alpine winter sports community.', false],
    ],
  },
  {
    id: 'style',
    name: 'Style & fashion',
    description: 'Apparel, beauty adjacent to style, and aesthetic culture.',
    categories: [
      ['Minimalist style', 'Capsule wardrobes, neutral palettes, design-led fashion.', true],
      ['Streetwear', 'Drop culture, sneakers, hype brands.', false],
      ['Designer eyewear', 'Premium glasses and sunglasses brands.', false],
      ['Watches', 'Mechanical and smart watch enthusiasts.', false],
      ['Sustainable fashion brands', 'Ethical labels, recycled materials.', true],
      ['Vintage shopping', 'Thrift, archive, second-hand luxury.', false],
    ],
  },
  {
    id: 'beauty',
    name: 'Beauty & grooming',
    description: 'Skincare, makeup, haircare and male grooming.',
    categories: [
      ['Skincare routines', 'Multi-step, ingredient-led skincare.', true],
      ['K-beauty', 'Korean beauty brands and routines.', false],
      ['Clean beauty', 'Natural / non-toxic formulations.', true],
      ['Men\u2019s grooming', 'Beard care, premium shaving, men\u2019s skincare.', false],
      ['Haircare', 'Scalp health, curly hair, colour treatments.', false],
    ],
  },
  {
    id: 'home',
    name: 'Home & living',
    description: 'Interior design, gardening, renovation and homewares.',
    categories: [
      ['Interior design', 'Mid-century, Scandi and contemporary aesthetics.', false],
      ['Home renovation', 'DIY and pro renovation projects.', false],
      ['Sustainable home', 'Insulation, heat pumps, water saving.', true],
      ['Gardening', 'Edible gardens, ornamentals, permaculture.', false],
      ['Smart appliances', 'Connected ovens, washing machines, robots.', true],
    ],
  },
  {
    id: 'family',
    name: 'Family & relationships',
    description: 'Family life, parenting, partnerships and friendship.',
    categories: [
      ['Parenting toddlers', 'Parents of children under 5.', false],
      ['Parenting teens', 'Parents of children 12-18.', false],
      ['Couples lifestyle', 'Long-term partnered audiences without kids.', true],
      ['Family travel', 'Holidays with children, family-friendly destinations.', false],
    ],
  },
  {
    id: 'pets',
    name: 'Pets',
    description: 'Companion animals: care, nutrition, training and lifestyle.',
    categories: [
      ['Dog owners', 'Audience with a dog at home.', false],
      ['Cat owners', 'Audience with a cat at home.', false],
      ['Pet nutrition', 'Premium and prescription pet food.', false],
      ['Pet adoption', 'Adopters from shelters and rescue networks.', true],
    ],
  },
  {
    id: 'sports',
    name: 'Sports & fitness',
    description: 'Active participants and fans across sport categories.',
    categories: [
      ['Football', 'Football (soccer) followers and fantasy players.', false],
      ['Cycling sport', 'Road cycling fans, Grand Tours.', false],
      ['Running events', 'Marathon and half-marathon runners.', false],
      ['Tennis', 'Tennis followers and casual players.', false],
      ['Outdoor fitness', 'Trail running, calisthenics, outdoor bootcamps.', true],
    ],
  },
  {
    id: 'music',
    name: 'Music & audio',
    description: 'Listening habits, genres, podcasts and live music.',
    categories: [
      ['Indie rock', 'Independent rock and alternative bands.', false],
      ['Electronic music', 'Techno, house, electronic festivals.', false],
      ['Podcasts', 'Regular podcast listeners across genres.', false],
      ['Vinyl records', 'Vinyl collectors and turntable owners.', false],
      ['Live concerts', 'Concert and festival goers.', false],
    ],
  },
  {
    id: 'screen',
    name: 'Film & TV',
    description: 'Streaming, cinema and TV consumption.',
    categories: [
      ['Documentaries', 'Long-form non-fiction watchers.', false],
      ['Sci-fi films', 'Science fiction film and series fans.', false],
      ['Independent cinema', 'Arthouse, festival circuit, A24-style audiences.', false],
      ['Premium streaming', 'Subscribers to multiple premium streamers.', true],
    ],
  },
  {
    id: 'gaming',
    name: 'Gaming',
    description: 'Players across console, PC and mobile.',
    categories: [
      ['Console gaming', 'PlayStation and Xbox players.', false],
      ['PC gaming', 'High-end PC and Steam audience.', false],
      ['Indie games', 'Audiences engaging with indie titles and itch.io.', false],
      ['Esports', 'Competitive gaming spectators and fans.', false],
    ],
  },
  {
    id: 'business',
    name: 'Business & finance',
    description: 'Personal finance, investing and entrepreneurship.',
    categories: [
      ['Personal finance', 'Budgeting, saving, mortgage and tax content.', false],
      ['ESG investing', 'Sustainability-screened investors.', true],
      ['Entrepreneurship', 'Founders, side projects, indie business.', false],
      ['Cryptocurrency', 'Crypto investors and on-chain culture.', false],
      ['Premium banking', 'Premium and private banking customers.', true],
    ],
  },
  {
    id: 'learning',
    name: 'Education & learning',
    description: 'Lifelong learners, online courses and language learning.',
    categories: [
      ['Online learning', 'Coursera, Udemy, Masterclass audiences.', false],
      ['Languages', 'People actively learning a second/third language.', false],
      ['Career development', 'Audiences upskilling for promotion or career change.', true],
    ],
  },
  {
    id: 'books',
    name: 'Books & literature',
    description: 'Readers across fiction, non-fiction and audio.',
    categories: [
      ['Literary fiction', 'Award-shortlisted and critically reviewed fiction.', false],
      ['Non-fiction', 'Science, history and business non-fiction readers.', false],
      ['Audiobooks', 'Regular audiobook listeners.', false],
    ],
  },
  {
    id: 'news',
    name: 'News & politics',
    description: 'Current affairs, opinion and political engagement.',
    categories: [
      ['Climate news', 'Audience following climate journalism.', true],
      ['European politics', 'EU and member-state politics followers.', false],
      ['Business news', 'FT, Bloomberg and Reuters audience.', false],
    ],
  },
  {
    id: 'culture',
    name: 'Art & culture',
    description: 'Museums, galleries, design and creative industries.',
    categories: [
      ['Modern art', 'Contemporary and modern art audiences.', false],
      ['Design culture', 'Industrial, graphic and product design fans.', false],
      ['Photography', 'Photo enthusiasts, exhibitions, photo books.', false],
    ],
  },
  {
    id: 'outdoors',
    name: 'Outdoors & nature',
    description: 'Hiking, camping, wildlife and outdoor lifestyle.',
    categories: [
      ['Hiking', 'Day-hikers and multi-day backpackers.', false],
      ['Camping', 'Tent and van campers, family camping.', false],
      ['Wildlife', 'Birdwatching, safari and nature documentaries.', false],
      ['National parks', 'Audiences visiting and supporting national parks.', false],
    ],
  },
  {
    id: 'diy',
    name: 'DIY & hobbies',
    description: 'Hand-made, restoration and personal projects.',
    categories: [
      ['Woodworking', 'Hand and power-tool woodworkers.', false],
      ['Model building', 'Scale models, miniatures, dioramas.', false],
      ['Knitting & crochet', 'Yarn craft makers.', false],
    ],
  },
  {
    id: 'causes',
    name: 'Charity & causes',
    description: 'Donors and supporters of social and environmental causes.',
    categories: [
      ['Environmental NGOs', 'Donors and volunteers for environmental NGOs.', true],
      ['Animal welfare', 'Animal-rights and welfare supporters.', false],
      ['Mental health charities', 'Supporters of mental health organisations.', true],
    ],
  },
  {
    id: 'mindfulness',
    name: 'Spirituality & mindfulness',
    description: 'Inner-life practices and contemplative traditions.',
    categories: [
      ['Mindfulness apps', 'Headspace, Calm and similar app users.', false],
      ['Buddhism', 'Audiences interested in Buddhist thought and practice.', false],
      ['Stoicism', 'Modern stoicism readers and practitioners.', true],
    ],
  },
  {
    id: 'parenting-care',
    name: 'Parenting & childcare',
    description: 'Practical parenting content and child development.',
    categories: [
      ['Newborn care', 'New parents (0-12 months).', false],
      ['School-age children', 'Parents of 6-12 year olds.', false],
      ['Child education', 'Audiences researching school choice and learning support.', true],
    ],
  },
]

/* Build a single category record from a seed (so the same name
   in the same interest always gives the same numbers). */
function buildCategory(rawName, description, isCurated, interest) {
  const seed = hashStr(`${interest.id}:${rawName}`)
  const rng = mulberry32(seed)
  const bias = INTEREST_SELECTIVITY_BIAS[interest.id] ?? 1
  /* Clamp the biased selectivity to a plausible range so the bias
     never produces a 12× outlier when the base sample is already
     in the long tail. */
  const sel = Math.max(0.15, Math.min(5.5, sampleSelectivity(rng) * bias))
  const audiencePen = sampleAudiencePen(rng)
  const baselinePen = Math.max(0.05, audiencePen / sel)
  const profiles = Math.round((audiencePen / 100) * REPORT_META.audienceSize)

  const id = `${interest.id}--${rawName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')}`

  const ageBuckets = ['18-34', '25-54', '18-65', '25-65', '35-65']
  const genders = ['All', 'All', 'All', 'Female-skew', 'Male-skew']

  const metaInterests = isCurated
    ? pickN(META_SIGNAL_POOL.interests, 3 + Math.floor(rng() * 3), rng)
    : null
  const behaviors = isCurated && rng() > 0.4
    ? pickN(META_SIGNAL_POOL.behaviors, 1 + Math.floor(rng() * 2), rng)
    : null
  const pages = isCurated && rng() > 0.55
    ? pickN(META_SIGNAL_POOL.pages, 1 + Math.floor(rng() * 3), rng)
    : null

  return {
    id,
    name: rawName,
    description,
    interestId: interest.id,
    interestName: interest.name,
    isCurated,
    audiencePen: round1(audiencePen),
    baselinePen: round1(baselinePen),
    selectivity: round2(sel),
    profiles,
    ageRange: ageBuckets[Math.floor(rng() * ageBuckets.length)],
    gender: genders[Math.floor(rng() * genders.length)],
    metaSignals: isCurated
      ? { interests: metaInterests, behaviors, pages, combinator: 'AND between signal types · OR within' }
      : null,
  }
}

function round1(n) { return Math.round(n * 10) / 10 }
function round2(n) { return Math.round(n * 100) / 100 }

/* Aggregate interest-level metrics from its children. We
   approximate "any-category reach" with a damped OR: take the top
   child + a small bump from the rest. Not statistically exact —
   good enough for a prototype where the relative ordering is what
   matters. */
function aggregateInterest(interest) {
  const items = interest.categories
  if (!items.length) {
    return { ...interest, audiencePen: 0, baselinePen: 0, selectivity: 0, profiles: 0, count: 0 }
  }
  const maxAud = Math.max(...items.map((i) => i.audiencePen))
  const maxBase = Math.max(...items.map((i) => i.baselinePen))
  const avgAud = items.reduce((s, i) => s + i.audiencePen, 0) / items.length
  const avgBase = items.reduce((s, i) => s + i.baselinePen, 0) / items.length
  const audiencePen = Math.min(95, maxAud + avgAud * 0.4)
  const baselinePen = Math.min(95, maxBase + avgBase * 0.4)
  const selectivity = baselinePen > 0 ? audiencePen / baselinePen : 0
  const profiles = Math.round((audiencePen / 100) * REPORT_META.audienceSize)
  return {
    ...interest,
    audiencePen: round1(audiencePen),
    baselinePen: round1(baselinePen),
    selectivity: round2(selectivity),
    profiles,
    count: items.length,
  }
}

export const INTERESTS = RAW_INTERESTS.map((g) => {
  const categories = g.categories.map(([name, description, isCurated]) =>
    buildCategory(name, description, isCurated, g),
  )
  return aggregateInterest({ ...g, categories })
})

export const ALL_CATEGORIES = INTERESTS.flatMap((g) => g.categories)

export const TOTALS = {
  interestCount: INTERESTS.length,
  categoryCount: ALL_CATEGORIES.length,
}

/* Sort helper shared by table + drawer. The user-facing labels
   for each sort column now live in `TopicsView` (they're tied to
   `TitanColumn` headers), so the static SORT_OPTIONS array that
   the old standalone sort dropdown used has been removed. */
export function sortRows(rows, sortBy, direction) {
  const mult = direction === 'asc' ? 1 : -1
  const sorted = [...rows].sort((a, b) => {
    if (sortBy === 'name') return a.name.localeCompare(b.name) * mult
    const av = a[sortBy] ?? 0
    const bv = b[sortBy] ?? 0
    return (av - bv) * mult
  })
  return sorted
}

export function selectivityTone(sel) {
  if (sel >= 1.2) return 'over'
  if (sel < 0.8) return 'under'
  return 'neutral'
}
