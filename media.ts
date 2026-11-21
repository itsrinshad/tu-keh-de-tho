import { supabase } from './lib'

export const SITE_BUCKET = 'site-media'
export const sitePublicUrl = (path: string) => supabase.storage.from(SITE_BUCKET).getPublicUrl(path).data.publicUrl

export type VideoInfo = { poster: Blob | null; w: number; h: number; sec: number }
/** Reads a video in the browser: size, length and a first-frame poster, so the admin only uploads one file. */
export async function videoInfo(f: File): Promise<VideoInfo> {
  const url = URL.createObjectURL(f); const none: VideoInfo = { poster: null, w: 0, h: 0, sec: 0 }
  try {
    const v = document.createElement('video'); v.muted = true; v.playsInline = true; v.preload = 'auto'; v.src = url
    await new Promise<void>((res, rej) => { v.onloadeddata = () => res(); v.onerror = () => rej(new Error('bad video')) })
    const w = v.videoWidth || 1280; const h = v.videoHeight || 720; const sec = v.duration || 0
    v.currentTime = Math.min(1, sec / 3 || 0.1); await new Promise<void>(r => { v.onseeked = () => r(); window.setTimeout(r, 1500) })
    const c = document.createElement('canvas'); const cw = Math.min(1280, w); c.width = cw; c.height = Math.round(cw * h / w)
    c.getContext('2d')!.drawImage(v, 0, 0, c.width, c.height)
    const poster = await new Promise<Blob | null>(r => c.toBlob(r, 'image/jpeg', 0.82))
    return { poster, w, h, sec }
  } catch { return none } finally { URL.revokeObjectURL(url) }
}
