import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from './lib'
import { useAuth } from './auth'
import { StyledAvatar, StyledName, ProfileCard } from './StyleKit'
import { useEquip } from './styleStore'
import { DeadlineBanner } from './deadline'
import { waLink, waGroup, igLink, WaIcon, IgIcon, PhoneIcon } from './ui'

export function GuildLinks({ admin }: { admin?: boolean }) {
  const [l, setL] = useState<any>(null)
  useEffect(() => { supabase.from('site_settings').select('value').eq('key', 'guild_links').maybeSingle().then(r => setL(r.data?.value ?? {})) }, [])
  if (!l) return null
  const items = [
    { h: waGroup(l.wa_group), t: 'WhatsApp Group', c: 'g-wa', i: <WaIcon /> },
    { h: igLink(l.ig_group), t: 'Instagram Group', c: 'g-ig', i: <IgIcon /> },
    { h: igLink(l.ig_page), t: 'Instagram Page', c: 'g-ig', i: <IgIcon /> },
    { h: waLink(l.admin_wa), t: 'Contact Admin', c: 'g-ct', i: <PhoneIcon /> },
  ].filter(x => x.h)
  if (!items.length) return admin ? <div className="glass p-3 text-xs text-gray-400 text-center">Add your WhatsApp/Instagram links in Admin → Guild links.</div> : null
  return <div className="glinks">{items.map(x => <a key={x.t} href={x.h} target="_blank" rel="noreferrer" className={'gbtn ' + x.c}>{x.i}{x.t}</a>)}</div>
}


export function Home() {
  const { session, profile, isAdmin } = useAuth(); const uid = session?.user.id
  const [stat, setStat] = useState<any>(null); const [top, setTop] = useState<any[]>([]); const [mine, setMine] = useState<any>(null); const [life, setLife] = useState<any>(null); const [news, setNews] = useState<any[]>([]); const [ready, setReady] = useState(0); const [badges, setBadges] = useState(0)
  const eq = useEquip(uid)
  useEffect(() => {
    supabase.from('guild_stats').select('*').maybeSingle().then(r => setStat(r.data))
    supabase.from('v_lb_weekly').select('member_id,username,display_name,avatar_url,glory,rnk').order('rnk').limit(3).then(r => setTop(r.data ?? []))
    if (!uid) return
    supabase.from('v_lb_weekly').select('glory,rnk').eq('member_id', uid).maybeSingle().then(r => setMine(r.data))
    supabase.from('v_lb_lifetime').select('glory,rnk').eq('member_id', uid).maybeSingle().then(r => setLife(r.data))
    supabase.from('member_badges').select('badge_id', { count: 'exact', head: true }).eq('member_id', uid).then(r => setBadges(r.count ?? 0))
    supabase.from('announcements').select('*').order('publish_at', { ascending: false }).limit(2).then(r => setNews(r.data ?? []))
    supabase.rpc('style_overview').then(r => { const t = ((r.data as any)?.tasks ?? []) as any[]; setReady(t.filter(x => x.kind === 'auto' && !x.owned && x.progress >= x.target).length) })
  }, [uid])
  const me = { id: uid ?? '', username: profile?.username ?? '', display_name: profile?.display_name, avatar_url: profile?.avatar_url, role: profile?.role, glory: life?.glory, rank: life?.rnk, badges }
  return (
    <div className="home">
      <div className="home-main space-y-4">
        <DeadlineBanner compact />
        <ProfileCard p={me} equip={eq} size="lg" play><div className="flex gap-2 flex-wrap mt-3"><Link to="/style" className="sym-btn">🎨 Style Studio</Link><Link to="/profile" className="sym-btn">My profile</Link></div></ProfileCard>
        {ready > 0 && <Link to="/quests" className="glass p-3 flex items-center gap-3 ready-banner"><span className="text-2xl">🏆</span><div className="flex-1"><b>{ready} reward{ready > 1 ? 's' : ''} ready to claim</b><div className="text-xs text-gray-400">Finish quests to unlock frames, golden profiles and more.</div></div><span aria-hidden="true">→</span></Link>}
        <div className="chips">
          <Link to="/players">🧑‍🤝‍🧑 Players</Link><Link to="/leaderboard">🏆 Rank</Link><Link to="/quests">⚔️ Quests</Link><Link to="/rules">📜 Rules</Link><Link to="/announcements">📢 News</Link><Link to="/polls">🗳 Polls</Link>{isAdmin && <Link to="/admin/glory">⚡ Glory</Link>}
        </div>
        <GuildLinks admin={isAdmin} />
      </div>
      <div className="home-side space-y-4">
        <div className="glass p-4">
          <h3 className="font-semibold mb-3">🏆 Top 3 this week</h3>
          {!top.length ? <p className="text-sm text-gray-500">No glory recorded yet this week.</p> :
            <div className="flex items-end justify-center gap-3">{[top[1], top[0], top[2]].map((t, i) => t && (
              <Link key={t.member_id} to={`/u/${t.username}`} className="flex flex-col items-center text-center" style={{ width: '30%' }}>
                <span className="text-xl">{['🥈', '🥇', '🥉'][i]}</span>
                <StyledAvatar uid={t.member_id} url={t.avatar_url} name={t.display_name || t.username} size={i === 1 ? 64 : 50} />
                <b className="text-xs mt-1 truncate w-full"><StyledName uid={t.member_id} name={t.display_name || t.username} /></b><span className="text-xs text-amber-300">{t.glory}</span>
              </Link>))}</div>}
        </div>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="glass p-3 text-xs text-gray-400">Weekly<br /><b className="text-xl text-white">{mine?.glory ?? 0}</b></div>
          <div className="glass p-3 text-xs text-gray-400">Members<br /><b className="text-xl text-white">{stat?.members ?? '—'}</b></div>
          <div className="glass p-3 text-xs text-gray-400">Total glory<br /><b className="text-xl text-white">{stat ? Number(stat.total_glory).toLocaleString() : '—'}</b></div>
        </div>
        {!!news.length && <div className="glass p-4"><h3 className="font-semibold mb-2">📢 Latest news</h3>{news.map((n: any) => <div key={n.id} className="border-t border-white/10 first:border-0 py-2"><b className="text-sm">{n.title}</b><p className="text-xs text-gray-400 line-clamp-2 whitespace-pre-wrap">{n.body}</p></div>)}<Link to="/announcements" className="text-amber-300 text-xs">All news →</Link></div>}
      </div>
    </div>
  )
}
