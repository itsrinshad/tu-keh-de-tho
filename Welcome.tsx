import { useCallback, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Hero } from './Hero'
import { Field3D } from './Field3D'
import { DeadlineBanner } from './deadline'
import { GuildLinks } from './Home'
import { ProfileCard } from './StyleKit'
import { normEquip } from './styleCatalog'
import { useSiteText } from './siteText'
import { useScrollFx, useSmoothWheel } from './smooth'

const SAMPLES = [
  { p: { id: 's1', username: 'aria', display_name: 'Aria', glory: 48210, rank: 1, badges: 6 }, e: { card: 'cd_gold', frame: 'fr_royal', namefx: 'nm_royal', backdrop: 'bd_gold', aura: 'au_sparkle', title: 'tt_legend', status: 'Golden Profile' } },
  { p: { id: 's2', username: 'kai', display_name: 'Kai', glory: 22960, rank: 7, badges: 3 }, e: { card: 'cd_obsidian', frame: 'fr_ember', namefx: 'nm_ember', backdrop: 'bd_ember', aura: 'au_embers', title: 'tt_champion', status: 'Video backdrops too' } },
  { p: { id: 's3', username: 'nova', display_name: 'Nova', glory: 9310, rank: 21, badges: 2 }, e: { card: 'cd_ice', frame: 'fr_aurora', namefx: 'nm_frost', backdrop: 'bd_aurora', aura: 'au_snow', title: 'tt_regular', status: 'Earned by quests' } },
]

// card that tilts in 3D toward the pointer
function Tilt({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const move = (e: React.PointerEvent) => { const el = ref.current; if (!el || e.pointerType === 'touch') return; const b = el.getBoundingClientRect(); el.style.setProperty('--rx', ((0.5 - (e.clientY - b.top) / b.height) * 12).toFixed(2) + 'deg'); el.style.setProperty('--ry', (((e.clientX - b.left) / b.width - 0.5) * 14).toFixed(2) + 'deg'); el.style.setProperty('--gx', ((e.clientX - b.left) / b.width * 100).toFixed(0) + '%'); el.style.setProperty('--gy', ((e.clientY - b.top) / b.height * 100).toFixed(0) + '%') }
  const reset = () => { const el = ref.current; if (!el) return; el.style.setProperty('--rx', '0deg'); el.style.setProperty('--ry', '0deg') }
  return <div ref={ref} className={'lp-tilt ' + className} onPointerMove={move} onPointerLeave={reset}>{children}</div>
}

// Public visitors page: the flower-field hero, then selling points, perks, profile showcase, steps, requirements, FAQ and join.
export function Welcome() {
  const { t, list, pairs } = useSiteText(); const root = useRef<HTMLDivElement>(null)
  const [fire, setFire] = useState(false); const [ready, setReady] = useState(false)
  const onFire = useCallback((v: boolean) => setFire(v), []); const onReady = useCallback((v: boolean) => setReady(v), [])
  useSmoothWheel(true); useScrollFx(root, [])
  const strip = t('marquee').split('·').map(s => s.trim()).filter(Boolean)
  return (
    <div className="welcome lp" ref={root}>
      <Field3D play={ready} fire={fire} />
      <Hero onFire={onFire} onReady={onReady} />
      <div className="lp-strip" aria-hidden="true"><div>{[0, 1].map(k => <span key={k}>{strip.map((s, i) => <b key={i}>{s}<i>✦</i></b>)}</span>)}</div></div>

      <section className="lp-sec" id="why"><div className="lp-in">
        <p className="lp-k" data-rv>{t('why.kicker')}</p>
        <p className="lp-lead" data-rv>{t('why.lead')}</p>
        <ol className="lp-facts">{pairs('why.items').map(([h, p], i) => <li key={h} data-rv style={{ ['--d' as any]: i * 90 + 'ms' }}><em>{String(i + 1).padStart(2, '0')}</em><h3>{h}</h3><p>{p}</p></li>)}</ol>
      </div></section>

      <section className="lp-sec" id="perks"><div className="lp-in">
        <p className="lp-k" data-rv>{t('perks.kicker')}</p><h2 className="lp-h2" data-rv>{t('perks.title')}</h2>
        <div className="lp-perks">{pairs('perks.items').map(([h, p], i) => <div key={h} data-rv style={{ ['--d' as any]: (i % 3) * 90 + 'ms' }}><Tilt><span className="lp-ic" aria-hidden="true">{['🏆', '🎨', '⚔️', '💬', '🥇', '🤝'][i % 6]}</span><h3>{h}</h3><p>{p}</p></Tilt></div>)}</div>
      </div></section>

      <section className="lp-sec" aria-label="Profile styles"><div className="lp-in">
        <p className="lp-k" data-rv>{t('showcase.kicker')}</p><h2 className="lp-h2" data-rv>{t('showcase.title')}</h2><p className="lp-p" data-rv>{t('showcase.text')}</p>
        <div className="w-cards" data-rv>{SAMPLES.map(s => <ProfileCard key={s.p.id} p={s.p} equip={normEquip(s.e as any)} />)}</div>
      </div></section>

      <section className="lp-sec"><div className="lp-in">
        <p className="lp-k" data-rv>{t('steps.kicker')}</p><h2 className="lp-h2" data-rv>{t('steps.title')}</h2>
        <ol className="w-steps">{list('steps.items').map((s, i) => <li key={s} data-rv style={{ ['--d' as any]: i * 70 + 'ms' }}><i>{i + 1}</i><span>{s}</span></li>)}</ol>
        <div className="mt-6" data-rv><DeadlineBanner /></div>
      </div></section>

      <section className="lp-sec"><div className="lp-in">
        <p className="lp-k" data-rv>{t('need.kicker')}</p><h2 className="lp-h2" data-rv>{t('need.title')}</h2>
        <div className="lp-need">{pairs('need.items').map(([h, p], i) => <div key={h} data-rv style={{ ['--d' as any]: i * 80 + 'ms' }}><b>✓ {h}</b><p>{p}</p></div>)}</div>
      </div></section>

      <section className="lp-sec"><div className="lp-in lp-narrow">
        <h2 className="lp-h2" data-rv>{t('faq.title')}</h2>
        <div className="lp-faq">{pairs('faq.items').map(([q, a]) => <details key={q} data-rv><summary>{q}</summary><p>{a}</p></details>)}</div>
      </div></section>

      <section id="join" className="lp-sec lp-join"><div className="lp-in text-center">
        <h2 className="lp-h2" data-rv>{t('join.title')}</h2><p className="lp-p mx-auto" data-rv>{t('join.text')}</p>
        <div className="my-5" data-rv><GuildLinks /></div>
        <Link to="/login" className="lp-btn mx-auto" data-rv>{t('hero.cta2')}<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12h16M14 6l6 6-6 6" /></svg></Link>
        <footer className="foot">{t('footer')}</footer>
      </div></section>
    </div>)
}
