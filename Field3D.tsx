import { useEffect, useRef } from 'react'

// A 3D flower field drawn on one canvas (no external files, works on every phone and PC, no WebGL needed).
// - the camera flies through the field: it drifts on its own and follows the page scroll ("scroll to wander")
// - depth of field: flowers near the camera and far away are soft, the middle is sharp (tilt-shift look)
// - the pointer / finger lights the flowers around it with a warm glow
// - `fire` turns the flowers into floating fireflies (used when the visitor reaches for the button)
// - `play` starts the bloom-in; `dim` makes it a calm, darker background for the member pages
const PAL = [[255, 112, 62], [255, 86, 168], [160, 118, 255], [255, 218, 86], [255, 150, 200], [120, 170, 255]]
const ss = (a: number, b: number, x: number) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t) }
const mk = (s: number) => { const c = document.createElement('canvas'); c.width = c.height = s; return c }

// 3 sharpness levels per sprite, made by shrinking and re-stretching (works on iOS too, where canvas blur filters are missing)
function blurred(src: HTMLCanvasElement, div: number) {
  if (div <= 1) return src
  const s = src.width, k = Math.max(4, Math.round(s / div)), small = mk(k), out = mk(s)
  small.getContext('2d')!.drawImage(src, 0, 0, k, k); const g = out.getContext('2d')!; g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high'; g.drawImage(small, 0, 0, s, s); return out
}
function flower(rgb: number[], petals: number) {
  const S = 96, m = S / 2, c = mk(S), g = c.getContext('2d')!
  const h = g.createRadialGradient(m, m, 0, m, m, m); h.addColorStop(0, `rgba(${rgb},.34)`); h.addColorStop(1, `rgba(${rgb},0)`); g.fillStyle = h; g.fillRect(0, 0, S, S)
  for (let i = 0; i < petals; i++) {
    g.save(); g.translate(m, m); g.rotate(i * Math.PI * 2 / petals)
    const pg = g.createLinearGradient(0, 0, 0, -S * 0.3); pg.addColorStop(0, `rgba(${rgb.map(v => Math.min(255, v + 70))},.95)`); pg.addColorStop(1, `rgba(${rgb.map(v => v * 0.8 | 0)},.92)`)
    g.beginPath(); g.ellipse(0, -S * 0.17, S * 0.075, S * 0.17, 0, 0, 7); g.fillStyle = pg; g.fill(); g.restore()
  }
  const k = g.createRadialGradient(m, m, 0, m, m, S * 0.1); k.addColorStop(0, 'rgba(255,246,200,1)'); k.addColorStop(1, `rgba(${rgb},0)`); g.fillStyle = k; g.fillRect(0, 0, S, S)
  return c
}
function leaf(tone: number) {
  const S = 80, m = S / 2, c = mk(S), g = c.getContext('2d')!
  const gr = [[22, 74, 44], [34, 100, 52], [14, 56, 38]][tone]
  const h = g.createRadialGradient(m, m, 0, m, m, m); h.addColorStop(0, `rgba(${gr},.95)`); h.addColorStop(0.55, `rgba(${gr},.45)`); h.addColorStop(1, `rgba(${gr},0)`); g.fillStyle = h; g.fillRect(0, 0, S, S)
  for (let i = 0; i < 3; i++) { g.save(); g.translate(m, m); g.rotate(i * 2.1 + tone); g.beginPath(); g.ellipse(0, -S * 0.16, S * 0.09, S * 0.24, 0, 0, 7); g.fillStyle = `rgba(${gr.map(v => v + 36)},.55)`; g.fill(); g.restore() }
  return c
}
function glow() {
  const S = 128, m = S / 2, c = mk(S), g = c.getContext('2d')!; const h = g.createRadialGradient(m, m, 0, m, m, m)
  h.addColorStop(0, 'rgba(255,240,190,.95)'); h.addColorStop(0.25, 'rgba(255,190,110,.4)'); h.addColorStop(1, 'rgba(255,150,80,0)'); g.fillStyle = h; g.fillRect(0, 0, S, S); return c
}

export function Field3D({ play = true, fire = false, dim = false }: { play?: boolean; fire?: boolean; dim?: boolean }) {
  const cv = useRef<HTMLCanvasElement>(null)
  const st = useRef({ play, fire, dim }); st.current.play = play; st.current.fire = fire; st.current.dim = dim

  useEffect(() => {
    const canvas = cv.current!; const g = canvas.getContext('2d', { alpha: false }); if (!g) return
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches
    const small = innerWidth < 820 || matchMedia('(pointer: coarse)').matches
    const N = st.current.dim ? (small ? 520 : 1000) : small ? 950 : 2200, FAR = 72, NEAR = 1.1, SPAN = FAR - NEAR
    const px = new Float32Array(N), pz = new Float32Array(N), sd = new Float32Array(N), pc = new Uint8Array(N), kind = new Uint8Array(N)
    for (let i = 0; i < N; i++) { px[i] = (Math.random() * 2 - 1) * 34; pz[i] = ((i + Math.random()) / N) * SPAN; sd[i] = Math.random(); pc[i] = (Math.random() * PAL.length) | 0; kind[i] = Math.random() < 0.42 ? 1 + ((Math.random() * 3) | 0) : 0 }   // 0 flower, 1..3 leaf tones. pz ascends with i so the field can be drawn far to near without sorting
    const fl = PAL.map((c, i) => { const base = flower(c, 5 + (i % 3)); return [base, blurred(base, 2.4), blurred(base, 5)] })
    const lf = [0, 1, 2].map(t => { const base = leaf(t); return [base, blurred(base, 2), blurred(base, 4)] })
    const glowImg = glow()
    const flies = Array.from({ length: small ? 36 : 70 }, () => ({ x: Math.random(), y: Math.random(), z: Math.random() * 0.9 + 0.1, p: Math.random() * 6, c: Math.random() < 0.6 ? 0 : 1 }))
    const dust = Array.from({ length: small ? 26 : 60 }, () => ({ x: Math.random(), y: Math.random(), z: Math.random() * 0.8 + 0.2, p: Math.random() * 6 }))
    let W = 0, H = 0, dpr = 1, sky: CanvasGradient, vig: CanvasGradient
    const resize = () => {
      dpr = Math.min(devicePixelRatio || 1, small ? 1.5 : 1.75); W = canvas.clientWidth || innerWidth; H = canvas.clientHeight || innerHeight
      canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr); g.setTransform(dpr, 0, 0, dpr, 0, 0)
      sky = g.createLinearGradient(0, 0, 0, H); sky.addColorStop(0, '#03040c'); sky.addColorStop(0.4, '#07101a'); sky.addColorStop(0.8, '#0a1a14'); sky.addColorStop(1, '#040a07')
      vig = g.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.3, W / 2, H / 2, Math.max(W, H) * 0.78); vig.addColorStop(0, 'rgba(0,0,0,0)'); vig.addColorStop(1, 'rgba(0,0,0,1)')
    }
    const ro = new ResizeObserver(resize); ro.observe(canvas); resize()

    const m = { x: -9999, y: -9999, tx: -9999, ty: -9999, nx: 0, ny: 0 }
    const onMove = (e: PointerEvent) => { m.tx = e.clientX; m.ty = e.clientY; if (m.x < -999) { m.x = m.tx; m.y = m.ty } m.nx = (m.tx / W - 0.5) * 2; m.ny = (m.ty / H - 0.5) * 2 }
    const onLeave = () => { m.tx = m.ty = -9999 }
    const onUp = (e: PointerEvent) => { if (e.pointerType === 'touch') window.setTimeout(onLeave, 700) }
    addEventListener('pointermove', onMove, { passive: true }); addEventListener('pointerdown', onMove, { passive: true }); addEventListener('pointerup', onUp, { passive: true }); document.addEventListener('pointerleave', onLeave)

    // scroll steers the camera. The target depth follows scrollY; the camera eases toward it, so it feels like gliding.
    let sTarget = scrollY * 0.02, cz = sTarget, drift = 0, sv = 0
    let visible = true; const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting }); io.observe(canvas)
    let disp = 0, bloom = reduce ? 1 : 0, kx = 0, ky = 0, last = performance.now(), raf = 0, t = 0, slow = 0, keep = 5, lt = performance.now()
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop)
      if (!visible || document.hidden) { last = now; return }
      const dt = Math.min(0.05, (now - last) / 1000); last = now; t += dt
      // adaptive quality: if the device struggles, draw fewer leaves/flowers (never turns the effect off)
      slow = slow * 0.95 + dt * 0.05; if (now - lt > 1500) { lt = now; if (slow > 0.03 && keep > 3) keep--; else if (slow < 0.02 && keep < 5) keep++ }
      const s = st.current, dimF = s.dim ? 0.55 : 1
      if (s.play && bloom < 1) bloom = Math.min(1, bloom + dt / 2.8)
      disp += ((s.fire ? 1 : 0) - disp) * Math.min(1, dt * 2.2)
      sTarget = scrollY * 0.02; const prev = cz
      drift += dt * (reduce ? 0.1 : 0.55) * (1 - disp)
      cz += ((sTarget + drift) - cz) * Math.min(1, dt * 3.2); sv = (cz - prev) / Math.max(dt, 0.001)
      m.x += (m.tx - m.x) * Math.min(1, dt * 9); m.y += (m.ty - m.y) * Math.min(1, dt * 9)
      const mx = m.tx < -999 ? -9999 : m.x, my = m.tx < -999 ? -9999 : m.y
      kx += ((reduce ? 0 : m.nx) - kx) * Math.min(1, dt * 2); ky += ((reduce ? 0 : m.ny) - ky) * Math.min(1, dt * 2)
      const f = H * 0.95, cx = W / 2 - kx * W * 0.035, hy = H * 0.4 - ky * H * 0.03, camx = Math.sin(cz * 0.05) * 5, ch = 1.9 + Math.min(1.2, Math.abs(sv) * 0.03)
      const R = Math.min(W, H) * 0.24, bf = ss(0, 1, bloom), focus = 15 + Math.sin(cz * 0.02) * 2

      g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1; g.fillStyle = sky; g.fillRect(0, 0, W, H)
      const hz = g.createRadialGradient(cx, hy, 0, cx, hy, W * 0.55); hz.addColorStop(0, 'rgba(255,170,90,.1)'); hz.addColorStop(1, 'rgba(255,170,90,0)'); g.fillStyle = hz; g.fillRect(0, 0, W, H)

      const czm = ((cz % SPAN) + SPAN) % SPAN, k0 = Math.min(N - 1, Math.floor(czm / SPAN * N))
      for (let j = 0; j < N; j++) {
        const i = (k0 - 1 - j + N * 2) % N
        if (keep < 5 && i % 5 >= keep) continue
        let d = pz[i] - czm; if (d < 0) d += SPAN; d += NEAR
        const wz = cz + (d - NEAR), x = px[i], isLeaf = kind[i] > 0
        const hgt = Math.sin(x * 0.18 + wz * 0.07) * 1.1 + Math.sin(x * 0.07 - wz * 0.11) * 1.5 + x * x * 0.012
        let sx = cx + (x - camx) / d * f, sy = hy + (ch - hgt) / d * f
        const bl = isLeaf ? ss(FAR, FAR * 0.35, d) : ss(FAR * 0.85, FAR * 0.15, d) * bf
        if (bl <= 0.01) continue
        let a = Math.pow(Math.max(0, 1 - d / FAR), 1.05) * ss(NEAR, 5, d) * (isLeaf ? 0.9 : 0.95) * dimF
        let size = (isLeaf ? 0.55 : 0.34 + sd[i] * 0.34) * f / d * bl
        if (disp > 0.01 && !isLeaf) { sx += Math.sin(t * 0.8 + sd[i] * 40) * disp * 20; sy -= disp * sd[i] * 80; a *= 1 - disp * 0.92 }
        let lit = 0
        if (mx > -999 && !isLeaf) { const dx = sx - mx, dy = sy - my, dd = Math.hypot(dx, dy); if (dd < R && dd > 0.01) { lit = 1 - dd / R; const p = lit * lit * R * 0.22; sx += dx / dd * p; sy += dy / dd * p; size *= 1 + lit * 0.5; a = Math.min(1, a * (1 + lit * 0.9)) } }
        if (size < 0.9 || sx < -70 || sx > W + 70 || sy < -70 || sy > H + 70) continue
        size = Math.min(size, 90); if (a <= 0.01) continue
        const off = Math.abs(d - focus); const lvl = d < 4.5 ? 2 : d < 8 ? 1 : off < 14 ? 0 : off < 26 ? 1 : 2
        g.globalAlpha = Math.min(1, a * (lvl === 2 ? 0.8 : 1))
        const sp = isLeaf ? lf[kind[i] - 1][lvl] : fl[pc[i]][lvl]
        if (!isLeaf && size > 7 && lvl < 2) { g.strokeStyle = 'rgba(30,120,70,.55)'; g.lineWidth = Math.max(0.6, size * 0.06); g.beginPath(); g.moveTo(sx, sy + size * 1.3); g.lineTo(sx, sy); g.stroke() }
        g.globalCompositeOperation = lit > 0.25 ? 'lighter' : 'source-over'
        g.drawImage(sp, sx - size, sy - size, size * 2, size * 2)
        g.globalCompositeOperation = 'source-over'
      }
      // pointer glow, like the warm bloom of light in the reference
      if (mx > -999 && !s.dim) { g.globalCompositeOperation = 'lighter'; g.globalAlpha = 0.55 * (1 - disp * 0.4); const gs = R * 1.7; g.drawImage(glowImg, mx - gs / 2, my - gs / 2, gs, gs) }
      g.globalCompositeOperation = 'lighter'
      // fireflies
      if (disp > 0.02) for (const q of flies) {
        const x = (q.x + Math.sin(t * 0.25 + q.p) * 0.04) * W, y = ((q.y - t * 0.012 * q.z) % 1 + 1) % 1 * H, tw = 0.5 + 0.5 * Math.sin(t * 2.2 + q.p * 3), r = (4 + q.z * 10) * (small ? 0.8 : 1)
        g.globalAlpha = disp * (0.35 + 0.65 * tw) * 0.95; g.drawImage(glowImg, x - r * 2, y - r * 2, r * 4, r * 4)
      }
      for (const q of dust) { const y = (q.y - t * 0.01 * q.z + 1) % 1; g.globalAlpha = 0.3 * q.z * (0.6 + 0.4 * Math.sin(t * 2 + q.p)); g.fillStyle = '#ffe9b8'; g.fillRect((q.x + Math.sin(t * 0.3 + q.p) * 0.01) * W, y * H, 1.6 * q.z, 1.6 * q.z) }
      g.globalCompositeOperation = 'source-over'; g.globalAlpha = (s.dim ? 0.78 : 0.62) + Math.min(0.2, Math.abs(sv) / 60); g.fillStyle = vig; g.fillRect(0, 0, W, H)
      if (s.dim) { g.globalAlpha = 0.45; g.fillStyle = '#05030f'; g.fillRect(0, 0, W, H) }
    }
    raf = requestAnimationFrame(loop)
    return () => { cancelAnimationFrame(raf); ro.disconnect(); io.disconnect(); removeEventListener('pointermove', onMove); removeEventListener('pointerdown', onMove); removeEventListener('pointerup', onUp); document.removeEventListener('pointerleave', onLeave) }
  }, [])

  return <canvas ref={cv} className="f3d" aria-hidden="true" />
}
