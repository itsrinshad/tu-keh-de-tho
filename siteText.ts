// Editable website text. Admins change it in Admin > Website text; anything left empty falls back to these defaults.
import { useEffect, useSyncExternalStore } from 'react'
import { supabase } from './lib'

export type TextField = { key: string; label: string; group: string; multi?: boolean; hint?: string }
export const TEXT_DEFAULTS: Record<string, string> = {
  'hero.eyebrow': 'Free Fire guild · Now recruiting',
  'hero.headline': 'Squad up. Rank up. Rise together.',
  'hero.caption': 'SYMBIOTES is a Free Fire guild for players who love to win,\nand love their team even more.',
  'hero.cta1': 'Join the guild',
  'hero.cta2': 'Member login',
  'marquee': 'Free Fire guild · Weekly glory wars · Ranked squads · Custom profiles · Tournaments · Friendly family · Daily active',
  'why.kicker': 'Why SYMBIOTES',
  'why.lead': 'More than a guild tag. A team that plays together every day, climbs the ranks together, and celebrates every win.',
  'why.items': 'Compete | Weekly and lifetime glory boards, live ranks and a clear deadline that keeps everyone sharp.\nCustomise | Golden profiles, frames, auras and video backdrops. Earn them with quests or receive them as gifts.\nConnect | Guild chat, polls and news in one calm place, with admins who actually reply.',
  'perks.kicker': 'What you get',
  'perks.title': 'Built for players who want more.',
  'perks.items': 'Glory ranking | See your daily, weekly, monthly and lifetime glory and exactly where you stand.\nProfile studio | Frames, name effects, auras, titles and your own video backdrop.\nQuests and rewards | Finish simple quests to unlock premium styles. Admins add new ones often.\nGuild chat | Group chats, direct messages and polls. Never miss a match call.\nTournaments | Guild events, MVP awards and badges for the best of the week.\nReal support | Friendly admins, fair rules and a family that has your back.',
  'showcase.kicker': 'Make it yours',
  'showcase.title': 'Profiles that stand out.',
  'showcase.text': 'Earn frames, golden profiles, auras and video backdrops through quests, or receive them as gifts. Everything you wear is shown to every member. Sample cards below.',
  'steps.kicker': 'How it works',
  'steps.title': 'Five simple steps.',
  'steps.items': 'Message an admin and ask for an account (use Join below).\nLog in and add your photo, game name and bio.\nPlay with the guild. Glory is recorded daily and the week closes on Sunday.\nFinish quests to unlock frames, golden profiles and video backdrops.\nOpen Players to see how everyone styled their profile.',
  'need.kicker': 'Who we are looking for',
  'need.title': 'Are you a SYMBIOTE?',
  'need.items': 'Active every day | Hop on daily and play with the squad.\nTeam first | Respect, good comms and no toxicity.\nGlory minded | Help the guild hit its weekly glory goal.\nReady to grow | Learn, rank up and help new players too.',
  'faq.title': 'Questions, answered.',
  'faq.items': 'Is it free to join? | Yes. SYMBIOTES is completely free. You only need an active Free Fire account.\nHow do I get an account? | Accounts are created by the admins. Tap Join below and message an admin on WhatsApp.\nHow is glory counted? | Admins record everyone\'s glory every day. The weekly score is the Monday to Saturday total, minus the last glory.\nCan I use my own profile video? | Yes. Reach the Cinema profile quest or ask a King Admin for a gift, then upload your video in Style Studio.',
  'join.title': 'Ready to join SYMBIOTES?',
  'join.text': 'Message an admin for your account, then log in and claim your spot on the leaderboard.',
  'footer': 'SYMBIOTES © Free Fire guild family',
}
export const TEXT_FIELDS: TextField[] = [
  { key: 'hero.eyebrow', label: 'Top small line', group: 'Top of the page' },
  { key: 'hero.headline', label: 'Big headline', group: 'Top of the page' },
  { key: 'hero.caption', label: 'Caption under the headline', group: 'Top of the page', multi: true },
  { key: 'hero.cta1', label: 'Main button text', group: 'Top of the page' },
  { key: 'hero.cta2', label: 'Login button text', group: 'Top of the page' },
  { key: 'marquee', label: 'Moving strip (separate with  ·  )', group: 'Top of the page', multi: true },
  { key: 'why.kicker', label: 'Small title', group: 'Why join' },
  { key: 'why.lead', label: 'Big sentence', group: 'Why join', multi: true },
  { key: 'why.items', label: 'Three points (one per line: Title | text)', group: 'Why join', multi: true },
  { key: 'perks.kicker', label: 'Small title', group: 'What you get' },
  { key: 'perks.title', label: 'Title', group: 'What you get' },
  { key: 'perks.items', label: 'Perks (one per line: Title | text)', group: 'What you get', multi: true },
  { key: 'showcase.kicker', label: 'Small title', group: 'Profile showcase' },
  { key: 'showcase.title', label: 'Title', group: 'Profile showcase' },
  { key: 'showcase.text', label: 'Text', group: 'Profile showcase', multi: true },
  { key: 'steps.kicker', label: 'Small title', group: 'How it works' },
  { key: 'steps.title', label: 'Title', group: 'How it works' },
  { key: 'steps.items', label: 'Steps (one per line)', group: 'How it works', multi: true },
  { key: 'need.kicker', label: 'Small title', group: 'Who we want' },
  { key: 'need.title', label: 'Title', group: 'Who we want' },
  { key: 'need.items', label: 'Points (one per line: Title | text)', group: 'Who we want', multi: true },
  { key: 'faq.title', label: 'Title', group: 'Questions' },
  { key: 'faq.items', label: 'Questions (one per line: Question | answer)', group: 'Questions', multi: true },
  { key: 'join.title', label: 'Title', group: 'Join section' },
  { key: 'join.text', label: 'Text', group: 'Join section', multi: true },
  { key: 'footer', label: 'Footer line', group: 'Join section' },
]

let over: Record<string, string> = {}; let ver = 0; let loaded = false
const subs = new Set<() => void>(); const sub = (f: () => void) => { subs.add(f); return () => { subs.delete(f) } }
const bump = () => { ver++; subs.forEach(f => f()) }
export async function loadSiteText() {
  try {
    const r = await supabase.from('site_settings').select('value').eq('key', 'site_text').maybeSingle()
    over = (r.data?.value && typeof r.data.value === 'object') ? r.data.value as Record<string, string> : {}
  } catch { /* keep defaults */ }
  loaded = true; bump()
}
export async function saveSiteText(next: Record<string, string>): Promise<string | null> {
  const clean: Record<string, string> = {}
  Object.entries(next).forEach(([k, v]) => { if (k in TEXT_DEFAULTS && v.trim() && v.trim() !== TEXT_DEFAULTS[k]) clean[k] = v.trim() })
  const { error } = await supabase.from('site_settings').upsert({ key: 'site_text', value: clean, updated_at: new Date().toISOString() })
  if (error) return error.message
  over = clean; bump(); return null
}
export const getOverrides = () => over
export function useSiteText() {
  useSyncExternalStore(sub, () => ver, () => ver)
  useEffect(() => { if (!loaded) loadSiteText() }, [])
  const t = (k: string) => over[k] || TEXT_DEFAULTS[k] || ''
  const list = (k: string) => t(k).split('\n').map(s => s.trim()).filter(Boolean)
  const pairs = (k: string): [string, string][] => list(k).map(l => { const i = l.indexOf('|'); return i < 0 ? [l, ''] : [l.slice(0, i).trim(), l.slice(i + 1).trim()] })
  return { t, list, pairs }
}
