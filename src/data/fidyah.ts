import { TranslationKey } from '../i18n/translations'

export type Ritual = 'hajj' | 'umrah'

/**
 * The expiation categories. Checked against Hashiyat al-Bajuri, Tuhfat
 * al-Muhtaj and Nihayat al-Muhtaj, which sort the dams into kinds:
 *
 * - 'full'     a dam for a missed rite: sheep, else fasting (ordered).
 * - 'choice'   the fidyah for a prohibited act: a free choice of a sheep,
 *              3 days' fasting, or 3 sa' of food to six poor people.
 * - 'partial'  one mudd of food per night, pebble, hair or nail.
 * - 'severe'   the first intercourse: a camel (ordered); invalidates the rite.
 * - 'hunting', 'marriage', 'ihsar'  their own rules.
 */
export type FidyahTier = 'full' | 'choice' | 'partial' | 'severe' | 'hunting' | 'marriage' | 'ihsar'

export type FidyahCategory = 'rite' | 'act' | 'special'

export interface FidyahItem {
  id: string
  /** 'both' = appears identically in both the Hajj and Umrah source documents. */
  ritual: Ritual | 'both'
  tier: FidyahTier
  category: FidyahCategory
  labelKey: TranslationKey
  /** Can only happen once, so it is a checkbox rather than a counter. */
  once?: boolean
}

export const FIDYAH_ITEMS: FidyahItem[] = [
  // ── Missed / omitted rites ──
  // These are not picked from a list: src/utils/hajjRites.ts derives them
  // from the Meeqat / Muzdalifah / Mina / stoning inputs. They live here so
  // every fidyah id resolves to a tier through one table.
  { id: 'meeqat_crossed', ritual: 'both', tier: 'full', category: 'rite', labelKey: 'fidyahMeeqatCrossed' },
  { id: 'muzdalifah_missed', ritual: 'hajj', tier: 'full', category: 'rite', labelKey: 'fidyahMuzdalifahMissed' },
  { id: 'mina_all_missed', ritual: 'hajj', tier: 'full', category: 'rite', labelKey: 'fidyahMinaAllMissed' },
  { id: 'mina_partial_missed', ritual: 'hajj', tier: 'partial', category: 'rite', labelKey: 'fidyahMinaPartialMissed' },
  { id: 'ramy_dam', ritual: 'hajj', tier: 'full', category: 'rite', labelKey: 'fidyahRamyDam' },
  { id: 'ramy_partial', ritual: 'hajj', tier: 'partial', category: 'rite', labelKey: 'fidyahRamyPartial' },

  // ── Prohibited acts — apply to both Hajj and Umrah ──
  // Each time one is repeated at a different time or place it counts again,
  // so most of these counters have no natural upper limit. (Hairs and nails
  // are the exception: see below.)
  { id: 'sewn_clothing', ritual: 'both', tier: 'choice', category: 'act', labelKey: 'fidyahSewnClothing' },
  { id: 'head_cover_men', ritual: 'both', tier: 'choice', category: 'act', labelKey: 'fidyahHeadCoverMen' },
  { id: 'face_cover_women', ritual: 'both', tier: 'choice', category: 'act', labelKey: 'fidyahFaceCoverWomen' },
  { id: 'hands_cover_women', ritual: 'both', tier: 'choice', category: 'act', labelKey: 'fidyahHandsCoverWomen' },
  { id: 'hair_oiling', ritual: 'both', tier: 'choice', category: 'act', labelKey: 'fidyahHairOiling' },
  { id: 'hair_removal_full', ritual: 'both', tier: 'choice', category: 'act', labelKey: 'fidyahHairRemovalFull' },
  // One or two hairs/nails is a mudd each. Three or more is one full fidyah:
  // expandCounts converts these counters to the 'full' item at three.
  { id: 'hair_removal_partial', ritual: 'both', tier: 'partial', category: 'act', labelKey: 'fidyahHairRemovalPartial' },
  { id: 'nail_trim_full', ritual: 'both', tier: 'choice', category: 'act', labelKey: 'fidyahNailTrimFull' },
  { id: 'nail_trim_partial', ritual: 'both', tier: 'partial', category: 'act', labelKey: 'fidyahNailTrimPartial' },
  { id: 'perfume', ritual: 'both', tier: 'choice', category: 'act', labelKey: 'fidyahPerfume' },
  { id: 'spousal_contact', ritual: 'both', tier: 'choice', category: 'act', labelKey: 'fidyahSpousalContact' },
  { id: 'masturbation', ritual: 'both', tier: 'choice', category: 'act', labelKey: 'fidyahMasturbation' },

  // Intercourse. The first time — before the first Tahallul in Hajj, or before
  // finishing Umrah — owes a camel and invalidates the rite; that can only
  // happen once. Every later occurrence (another after the invalidating one,
  // or one between the two Tahallul of Hajj) owes a free-choice fidyah, and
  // that repeats each time even at the same time and place.
  { id: 'intercourse_before_tahallul', ritual: 'hajj', tier: 'severe', category: 'act', labelKey: 'fidyahIntercourseBeforeTahallul', once: true },
  { id: 'intercourse_umrah', ritual: 'umrah', tier: 'severe', category: 'act', labelKey: 'fidyahIntercourseUmrah', once: true },
  { id: 'intercourse_repeat', ritual: 'both', tier: 'choice', category: 'act', labelKey: 'fidyahIntercourseRepeat' },
  { id: 'intercourse_after_tahallul', ritual: 'hajj', tier: 'choice', category: 'act', labelKey: 'fidyahIntercourseAfterTahallul' },

  // ── Special categories — apply to both ──
  { id: 'marriage_contract', ritual: 'both', tier: 'marriage', category: 'special', labelKey: 'fidyahMarriageContract', once: true },
  { id: 'hunting', ritual: 'both', tier: 'hunting', category: 'special', labelKey: 'fidyahHunting' },
  { id: 'ihsar', ritual: 'both', tier: 'ihsar', category: 'special', labelKey: 'fidyahIhsar', once: true },
]

export function getFidyahItemsForRitual(ritual: Ritual): FidyahItem[] {
  return FIDYAH_ITEMS.filter(item => item.ritual === ritual || item.ritual === 'both')
}
