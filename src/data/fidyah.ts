import { TranslationKey } from '../i18n/translations'

export type Ritual = 'hajj' | 'umrah'

/**
 * The six expiation categories from the source fidyah rules (الفدية.docx /
 * fidyaUmrah.docx). Tiers 'full' and 'partial' share the same underlying
 * obligation (a full fidyah vs a smaller mudd-based one) but are reached by
 * two different kinds of cause — a fully missed/omitted rite, or fully
 * committing a prohibited act — which the source document itself groups
 * together as one fidyah with a "general" and a "specific" cause.
 */
export type FidyahTier = 'full' | 'partial' | 'severe' | 'hunting' | 'marriage' | 'ihsar'

export type FidyahCategory = 'rite' | 'act' | 'special'

export interface FidyahItem {
  id: string
  /** 'both' = appears identically in both the Hajj and Umrah source documents. */
  ritual: Ritual | 'both'
  tier: FidyahTier
  category: FidyahCategory
  labelKey: TranslationKey
}

export const FIDYAH_ITEMS: FidyahItem[] = [
  // ── Missed / omitted rites — Hajj only (Umrah has no Muzdalifah, Mina, Ramy) ──
  { id: 'meeqat_crossed', ritual: 'both', tier: 'full', category: 'rite', labelKey: 'fidyahMeeqatCrossed' },
  { id: 'muzdalifah_missed', ritual: 'hajj', tier: 'full', category: 'rite', labelKey: 'fidyahMuzdalifahMissed' },
  { id: 'mina_all_missed', ritual: 'hajj', tier: 'full', category: 'rite', labelKey: 'fidyahMinaAllMissed' },
  { id: 'mina_partial_missed', ritual: 'hajj', tier: 'partial', category: 'rite', labelKey: 'fidyahMinaPartialMissed' },
  { id: 'ramy_full_day_missed', ritual: 'hajj', tier: 'full', category: 'rite', labelKey: 'fidyahRamyFullDayMissed' },
  { id: 'ramy_last_day_missed', ritual: 'hajj', tier: 'full', category: 'rite', labelKey: 'fidyahRamyLastDayMissed' },
  { id: 'ramy_partial_early', ritual: 'hajj', tier: 'partial', category: 'rite', labelKey: 'fidyahRamyPartialEarly' },
  { id: 'ramy_partial_last_day', ritual: 'hajj', tier: 'partial', category: 'rite', labelKey: 'fidyahRamyPartialLastDay' },

  // ── Prohibited acts — apply to both Hajj and Umrah ──
  { id: 'sewn_clothing', ritual: 'both', tier: 'full', category: 'act', labelKey: 'fidyahSewnClothing' },
  { id: 'head_cover_men', ritual: 'both', tier: 'full', category: 'act', labelKey: 'fidyahHeadCoverMen' },
  { id: 'face_cover_women', ritual: 'both', tier: 'full', category: 'act', labelKey: 'fidyahFaceCoverWomen' },
  { id: 'hands_cover_women', ritual: 'both', tier: 'full', category: 'act', labelKey: 'fidyahHandsCoverWomen' },
  { id: 'hair_oiling', ritual: 'both', tier: 'full', category: 'act', labelKey: 'fidyahHairOiling' },
  { id: 'hair_removal_full', ritual: 'both', tier: 'full', category: 'act', labelKey: 'fidyahHairRemovalFull' },
  { id: 'hair_removal_partial', ritual: 'both', tier: 'partial', category: 'act', labelKey: 'fidyahHairRemovalPartial' },
  { id: 'nail_trim_full', ritual: 'both', tier: 'full', category: 'act', labelKey: 'fidyahNailTrimFull' },
  { id: 'nail_trim_partial', ritual: 'both', tier: 'partial', category: 'act', labelKey: 'fidyahNailTrimPartial' },
  { id: 'perfume', ritual: 'both', tier: 'full', category: 'act', labelKey: 'fidyahPerfume' },
  { id: 'spousal_contact', ritual: 'both', tier: 'full', category: 'act', labelKey: 'fidyahSpousalContact' },
  { id: 'masturbation', ritual: 'both', tier: 'full', category: 'act', labelKey: 'fidyahMasturbation' },

  // Hajj distinguishes intercourse before vs after the first Tahallul;
  // Umrah's Ihram ends all at once, so it has only a single "intercourse" item.
  { id: 'intercourse_after_tahallul', ritual: 'hajj', tier: 'full', category: 'act', labelKey: 'fidyahIntercourseAfterTahallul' },
  { id: 'intercourse_before_tahallul', ritual: 'hajj', tier: 'severe', category: 'act', labelKey: 'fidyahIntercourseBeforeTahallul' },
  { id: 'intercourse_umrah', ritual: 'umrah', tier: 'severe', category: 'act', labelKey: 'fidyahIntercourseUmrah' },

  // ── Special categories — apply to both ──
  { id: 'marriage_contract', ritual: 'both', tier: 'marriage', category: 'special', labelKey: 'fidyahMarriageContract' },
  { id: 'hunting', ritual: 'both', tier: 'hunting', category: 'special', labelKey: 'fidyahHunting' },
  { id: 'ihsar', ritual: 'both', tier: 'ihsar', category: 'special', labelKey: 'fidyahIhsar' },
]

export function getFidyahItemsForRitual(ritual: Ritual): FidyahItem[] {
  return FIDYAH_ITEMS.filter(item => item.ritual === ritual || item.ritual === 'both')
}
