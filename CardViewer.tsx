"use client";
// app/card/[cardId]/CardViewer.tsx
// npm i framer-motion
import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Cormorant_Garamond, Prompt } from "next/font/google";

const serif = Cormorant_Garamond({ subsets: ["latin"], weight: ["500"], style: ["italic"] });
const sans = Prompt({ subsets: ["thai", "latin"], weight: ["300", "400", "500"] });

export type CardData = {
  id: string;
  category: string;
  images: string[];
  videoUrl: string | null;
  message: string;
  musicUrl: string | null;
};

const THEMES: Record<string, { bg1: string; bg2: string; a: string; b: string; emoji: string }> = {
  love:     { bg1: "#2a0a1c", bg2: "#8a2a58", a: "#ff6f9f", b: "#ffb36b", emoji: "💗" },
  congrat:  { bg1: "#2b1a05", bg2: "#8a5a12", a: "#ffd166", b: "#ff9f5a", emoji: "🎉" },
  thanks:   { bg1: "#062a24", bg2: "#1f7a5f", a: "#7ee0b5", b: "#c7f08a", emoji: "🌿" },
  sorry:    { bg1: "#1a1233", bg2: "#5a47a8", a: "#c3a6ff", b: "#9ec5ff", emoji: "🕊️" },
  birthday: { bg1: "#2d1210", bg2: "#a8493a", a: "#ff9a8b", b: "#ffd1a6", emoji: "🎂" },
  anniv:    { bg1: "#25091a", bg2: "#7a2150", a: "#ff8aa1", b: "#e6b3ff", emoji: "💍" },
  cheer:    { bg1: "#06223a", bg2: "#1f6fa8", a: "#7dd3fc", b: "#fde68a", emoji: "☀️" },
  miss:     { bg1: "#0f1330", bg2: "#3b3f9a", a: "#a5b4fc", b: "#f0abfc", emoji: "🌙" },
};

type Step = "cover" | "gallery" | "video" | "wish";

const slide = {
  initial: { opacity: 0, x: 60 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -60 },
};

export default function CardViewer({ card }: { card: CardData }) {
  const t = THEMES[card.category] ?? THEMES.love;
  const reduce = useReducedMotion();
  const audioRef = useRef<HTMLAudioElement>(null);
  const [musicOn, setMusicOn] = useState(false);
  const [i, setI] = useState(0);

  const steps = useMemo<Step[]>(() => {
    const s: Step[] = ["cover"];
    if (card.images.length) s.push("gallery");
    if (card.videoUrl) s.push("video");
    if (card.message) s.push("wish");
    return s;
  }, [card]);

  const step = steps[i];
  const next = () => setI((n) => Math.min(n + 1, steps.length - 1));

  // เปิดการ์ด = user gesture → เล่นเพลงได้ (เบราว์เซอร์มือถือบล็อก autoplay ถ้าไม่มีการกด)
  const openCard = async () => {
    const a = audioRef.current;
    if (a && card.musicUrl) {
      a.volume = 0;
      try {
        await a.play();
        setMusicOn(true);
        let v = 0; // fade in
        const id = setInterval(() => {
          v = Math.min(v + 0.05, 0.5);
          a.volume = v;
          if (v >= 0.5) clearInterval(id);
        }, 120);
      } catch {}
    }
    next();
  };

  const toggleMusic = () => {
    const a = audioRef.current;
    if (!a) return;
    if (a.paused) { a.play(); setMusicOn(true); } else { a.pause(); setMusicOn(false); }
  };

  // วิดีโอเล่น → พักเพลงพื้นหลัง, จบ/ออกจากหน้า → เล่นต่อ
  const duckMusic = () => audioRef.current?.pause();
  const resumeMusic = () => { if (musicOn) audioRef.current?.play().catch(() => {}); };

  return (
    <main
      className={sans.className}
      style={{
        ["--a" as any]: t.a, ["--b" as any]: t.b,
        minHeight: "100dvh", color: "#fff", overflow: "hidden", position: "relative",
        background: `radial-gradient(120% 80% at 50% 0%, ${t.bg2}, ${t.bg1} 70%)`,
        paddingTop: "env(safe-area-inset-top)", paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      {card.musicUrl && <audio ref={audioRef} src={card.musicUrl} loop preload="auto" />}

      {step !== "cover" && card.musicUrl && (
        <button onClick={toggleMusic} aria-label={musicOn ? "ปิดเพลง" : "เปิดเพลง"}
          style={{ position: "absolute", top: "max(14px, env(safe-area-inset-top))", right: 14, zIndex: 20,
            width: 40, height: 40, borderRadius: 99, border: "1px solid rgba(255,255,255,.25)",
            background: "rgba(255,255,255,.1)", color: "#fff", fontSize: 18 }}>
          {musicOn ? "♪" : "×"}
        </button>
      )}

      {/* จุดบอกตำแหน่งหน้า */}
      <div style={{ position: "absolute", bottom: "max(16px, env(safe-area-inset-bottom))", left: 0, right: 0,
        display: "flex", justifyContent: "center", gap: 6, zIndex: 20, pointerEvents: "none" }}>
        {steps.map((_, n) => (
          <span key={n} style={{ width: n === i ? 22 : 6, height: 6, borderRadius: 9, transition: "all .4s",
            background: n === i ? `linear-gradient(90deg,${t.a},${t.b})` : "rgba(255,255,255,.3)" }} />
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.section key={step} {...(reduce ? {} : slide)} transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          style={{ minHeight: "100dvh", display: "flex", flexDirection: "column", alignItems: "center",
            justifyContent: "center", textAlign: "center", padding: "56px 22px 64px", gap: 22 }}>

          {step === "cover" && <Cover t={t} onOpen={openCard} />}
          {step === "gallery" && <Gallery t={t} images={card.images} onDone={next} isLast={i === steps.length - 1} />}
          {step === "video" && (
            <VideoStep t={t} src={card.videoUrl!} onPlay={duckMusic} onEnd={resumeMusic} onNext={next}
              isLast={i === steps.length - 1} />
          )}
          {step === "wish" && <Wish t={t} text={card.message} reduce={!!reduce} />}
        </motion.section>
      </AnimatePresence>
    </main>
  );
}

/* ───────── 1. Cover ───────── */
function Cover({ t, onOpen }: { t: (typeof THEMES)[string]; onOpen: () => void }) {
  return (
    <>
      <motion.div
        initial={{ scale: 0.85, rotate: -4, opacity: 0 }} animate={{ scale: 1, rotate: 0, opacity: 1 }}
        transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
        style={{ width: "min(80vw,320px)", aspectRatio: "3/4", borderRadius: 26, position: "relative",
          background: "linear-gradient(160deg,rgba(255,255,255,.16),rgba(255,255,255,.04))",
          border: "1px solid rgba(255,255,255,.28)", boxShadow: "0 30px 80px rgba(0,0,0,.45)",
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 26, padding: 28 }}>
        <p className={serif.className} style={{ fontSize: 34, lineHeight: 1.2, margin: 0 }}>
          You are my favorite memory.
        </p>
        <motion.div animate={{ scale: [1, 1.14, 1] }} transition={{ duration: 1.6, repeat: Infinity }}>
          <Heart a={t.a} b={t.b} size={64} />
        </motion.div>
      </motion.div>
      <button onClick={onOpen} style={btn(t)}>เปิดอ่านการ์ด</button>
    </>
  );
}

/* ───────── 2. Gallery (ปัดซ้าย/ขวา หรือกดลูกศร) ───────── */
function Gallery({ t, images, onDone, isLast }: { t: (typeof THEMES)[string]; images: string[]; onDone: () => void; isLast: boolean }) {
  const [n, setN] = useState(0);
  const [dir, setDir] = useState(1);
  const go = (d: number) => {
    const k = n + d;
    if (k < 0) return;
    if (k >= images.length) return onDone();
    setDir(d); setN(k);
  };
  const atEnd = n === images.length - 1;
  return (
    <>
      <div style={{ position: "relative", width: "min(86vw,380px)", aspectRatio: "3/4" }}>
        <AnimatePresence mode="popLayout" custom={dir}>
          <motion.img
            key={n} src={images[n]} alt="" draggable={false}
            custom={dir}
            initial={{ opacity: 0, x: dir * 80, rotate: dir * 3 }}
            animate={{ opacity: 1, x: 0, rotate: 0 }}
            exit={{ opacity: 0, x: dir * -80, rotate: dir * -3 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            drag="x" dragConstraints={{ left: 0, right: 0 }} dragElastic={0.4}
            onDragEnd={(_, info) => { if (info.offset.x < -60) go(1); else if (info.offset.x > 60) go(-1); }}
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover",
              borderRadius: 22, border: "1px solid rgba(255,255,255,.25)", boxShadow: "0 24px 70px rgba(0,0,0,.5)",
              touchAction: "pan-y" }}
          />
        </AnimatePresence>
      </div>
      {images.length > 1 && (
        <span style={{ fontSize: 13, opacity: 0.7 }}>{n + 1} / {images.length} · ปัดเพื่อดูรูปถัดไป</span>
      )}
      <button onClick={() => go(1)} aria-label="ต่อไป" style={{ background: "none", border: 0, padding: 6 }}>
        <motion.div animate={{ scale: [1, 1.18, 1] }} transition={{ duration: 1.5, repeat: Infinity }}>
          <Heart a={t.a} b={t.b} size={50} />
        </motion.div>
      </button>
    </>
  );
}

/* ───────── 3. Video ───────── */
function VideoStep({ t, src, onPlay, onEnd, onNext, isLast }: {
  t: (typeof THEMES)[string]; src: string; onPlay: () => void; onEnd: () => void; onNext: () => void; isLast: boolean;
}) {
  useEffect(() => () => onEnd(), []); // ออกจากหน้า → เล่นเพลงต่อ
  return (
    <>
      <video
        src={src} controls playsInline preload="auto"
        onPlay={onPlay} onPause={onEnd} onEnded={onEnd}
        style={{ width: "min(92vw,420px)", maxHeight: "68dvh", borderRadius: 22, background: "#000",
          boxShadow: "0 24px 70px rgba(0,0,0,.55)" }}
      />
      <button onClick={onNext} style={btn(t)}>{isLast ? "เก็บไว้ในความทรงจำ" : "ต่อไป"}</button>
    </>
  );
}

/* ───────── 4. Wish Wall ───────── */
function Wish({ t, text, reduce }: { t: (typeof THEMES)[string]; text: string; reduce: boolean }) {
  const [kept, setKept] = useState(false);
  const hearts = useMemo(
    () => Array.from({ length: 16 }, (_, k) => ({ k, x: Math.random() * 100, d: 6 + Math.random() * 5, s: 0.6 + Math.random() })),
    []
  );
  return (
    <>
      {!reduce && hearts.map((h) => (
        <motion.span key={h.k} aria-hidden
          initial={{ y: "105vh", opacity: 0 }} animate={{ y: "-10vh", opacity: [0, 0.7, 0] }}
          transition={{ duration: h.d, repeat: Infinity, delay: h.k * 0.5, ease: "linear" }}
          style={{ position: "fixed", left: `${h.x}vw`, fontSize: 18 * h.s, pointerEvents: "none", zIndex: 1 }}>
          {t.emoji}
        </motion.span>
      ))}
      <motion.div
        initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9 }}
        style={{ zIndex: 2, maxWidth: 420, padding: "34px 26px", borderRadius: 26,
          background: "rgba(255,255,255,.1)", border: "1px solid rgba(255,255,255,.25)", backdropFilter: "blur(10px)" }}>
        <p style={{ margin: 0, fontSize: 19, lineHeight: 1.85, fontWeight: 300, whiteSpace: "pre-wrap" }}>{text}</p>
      </motion.div>
      <button onClick={() => setKept(true)} disabled={kept} style={{ ...btn(t), zIndex: 2, opacity: kept ? 0.7 : 1 }}>
        {kept ? "เก็บไว้ในความทรงจำแล้ว" : "เก็บไว้ในความทรงจำ"}
      </button>
    </>
  );
}

/* ───────── helpers ───────── */
const btn = (t: { a: string; b: string }): React.CSSProperties => ({
  border: 0, borderRadius: 99, padding: "14px 34px", fontSize: 16, fontWeight: 500, color: "#2b1020",
  background: `linear-gradient(90deg,${t.a},${t.b})`, boxShadow: `0 10px 30px ${t.a}55`, cursor: "pointer",
});

function Heart({ a, b, size }: { a: string; b: string; size: number }) {
  const id = useMemo(() => "g" + Math.random().toString(36).slice(2, 8), []);
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden style={{ filter: `drop-shadow(0 0 14px ${a})` }}>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={a} /><stop offset="1" stopColor={b} />
        </linearGradient>
      </defs>
      <path fill={`url(#${id})`} d="M12 21s-7.5-4.6-9.6-9.2C.9 8.4 2.7 5 6 5c2 0 3.4 1.1 4.2 2.4h.1C11.1 6.1 12.4 5 14.4 5c3.3 0 5.1 3.4 3.6 6.8C15.5 16.4 12 21 12 21z" />
    </svg>
  );
}
