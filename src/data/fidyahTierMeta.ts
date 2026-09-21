import { FidyahTier } from './fidyah'
import { TranslationKey } from '../i18n/translations'

/** How each expiation tier is titled, explained and coloured on screen. */
export const TIER_META: Record<FidyahTier, { titleKey: TranslationKey; explanationKey: TranslationKey; color: string }> = {
  full:     { titleKey: 'fidyahTierFullTitle',     explanationKey: 'fidyahTierFullExplanation',     color: '#1a5f3f' },
  choice:   { titleKey: 'fidyahTierChoiceTitle',   explanationKey: 'fidyahTierChoiceExplanation',   color: '#2563eb' },
  partial:  { titleKey: 'fidyahTierPartialTitle',  explanationKey: 'fidyahTierPartialExplanation',  color: '#b8860b' },
  severe:   { titleKey: 'fidyahTierSevereTitle',   explanationKey: 'fidyahTierSevereExplanation',   color: '#dc2626' },
  hunting:  { titleKey: 'fidyahTierHuntingTitle',  explanationKey: 'fidyahTierHuntingExplanation',  color: '#0f766e' },
  marriage: { titleKey: 'fidyahTierMarriageTitle', explanationKey: 'fidyahTierMarriageExplanation', color: '#6b7280' },
  ihsar:    { titleKey: 'fidyahTierIhsarTitle',    explanationKey: 'fidyahTierIhsarExplanation',    color: '#7c3aed' },
}
