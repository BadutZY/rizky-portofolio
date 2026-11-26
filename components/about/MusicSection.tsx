"use client";

import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Reveal from "@/components/ui/Reveal";
import Magnetic from "@/components/ui/Magnetic";
import Icon from "@/components/ui/Icon";
import Tilt from "@/components/about/Tilt";
import { music, ytMusicUrl } from "@/lib/music";

/* ───────── YouTube IFrame API (loaded once, only when the section comes near the screen) ───────── */

declare global {
  interface Window {
    YT?: any;
    onYouTubeIframeAPIReady?: () => void;
  }
}

let ytLoading: Promise<any> | null = null;
function loadYT(): Promise<any> {
  if (typeof window === "undefined") return Promise.reject(new Error("no window"));
  if (window.YT?.Player) return Promise.resolve(window.YT);
  if (ytLoading) return ytLoading;
  ytLoading = new Promise((resolve, reject) => {
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      prev?.();
      resolve(window.YT);
    };
    const s = document.createElement("script");
    s.src = "https://www.youtube.com/iframe_api";
    s.async = true;
    s.onerror = () => {
      ytLoading = null;
      reject(new Error("YouTube API failed to load"));
    };
    document.head.appendChild(s);
  });
  return ytLoading;
}

/* ───────── helpers ───────── */

const BARS = 64;

/** A stable, good looking fake waveform (same on the server and the client), different for every song. */
function makeWave(seed: string, n = BARS): number[] {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  const rnd = () => {
    h += 0x6d2b79f5;
    let t = h;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const out: number[] = [];
  let prev = 0.5;
  for (let i = 0; i < n; i++) {
    const x = i / (n - 1);
    const env = Math.min(1, x * 7 + 0.2) * Math.min(1, (1 - x) * 7 + 0.2);
    prev = prev * 0.45 + rnd() * 0.55;
    out.push(Math.max(0.14, Math.min(1, (0.3 + prev * 0.7) * env)));
  }
  return out;
}

const fmt = (s: number) => {
  if (!isFinite(s) || s < 0) s = 0;
  const m = Math.floor(s / 60);
  const r = Math.floor(s % 60);
  return `${m}:${String(r).padStart(2, "0")}`;
};

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));

function Eq({ on }: { on: boolean }) {
  return (
    <span className={`mp-eq${on ? " on" : ""}`} aria-hidden>
      <i />
      <i />
      <i />
    </span>
  );
}

/* ───────── one player (pill with waveform) ───────── */

type CardProps = {
  i: number;
  id: string;
  title: string;
  artist: string;
  isActive: boolean;
  playing: boolean;
  cur: number;
  dur: number;
  bad: boolean;
  onToggle: (i: number) => void;
  onSeek: (i: number, ratio: number) => void;
};

const TrackCard = memo(function TrackCard({ i, id, title, artist, isActive, playing, cur, dur, bad, onToggle, onSeek }: CardProps) {
  const bars = useMemo(() => makeWave(id + title), [id, title]);
  const wave = useRef<HTMLDivElement>(null);
  const drag = useRef(false);
  const [scrub, setScrub] = useState<number | null>(null);

  const ratio = isActive && dur ? clamp(cur / dur) : 0;
  const shown = scrub ?? ratio;
  const head = Math.floor(shown * BARS);
  const isPlaying = isActive && playing;

  const ratioFrom = (e: React.PointerEvent) => {
    const r = wave.current!.getBoundingClientRect();
    return clamp((e.clientX - r.left) / r.width);
  };

  const down = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    if (!isActive) {
      onToggle(i);
      return;
    }
    if (!dur) return;
    drag.current = true;
    e.currentTarget.setPointerCapture(e.pointerId);
    setScrub(ratioFrom(e));
  };
  const move = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === "mouse") {
      const r = e.currentTarget.getBoundingClientRect();
      e.currentTarget.style.setProperty("--hx", `${e.clientX - r.left}px`);
    }
    if (drag.current) setScrub(ratioFrom(e));
  };
  const up = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!drag.current) return;
    drag.current = false;
    onSeek(i, ratioFrom(e));
    setScrub(null);
  };
  const cancel = () => {
    drag.current = false;
    setScrub(null);
  };
  const key = (e: React.KeyboardEvent) => {
    if (!isActive || !dur) return;
    if (e.key === "ArrowRight" || e.key === "ArrowUp") {
      e.preventDefault();
      onSeek(i, clamp((cur + 5) / dur));
    } else if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
      e.preventDefault();
      onSeek(i, clamp((cur - 5) / dur));
    }
  };

  const elapsed = shown * dur;

  return (
    <article className={`mp-track spot${isActive ? " on" : ""}${isPlaying ? " play" : ""}`}>
      <header className="mp-meta">
        <span className="mp-n">{String(i + 1).padStart(2, "0")}</span>
        <div className="mp-txt">
          <h3 className="mp-title">{title}</h3>
          <p className="mp-artist">{artist}</p>
        </div>
        <Eq on={isPlaying} />
        <a className="icon-btn ring mp-ext" href={ytMusicUrl(id)} target="_blank" rel="noopener noreferrer" aria-label={`Open ${title} in YouTube Music`} data-cursor="Open">
          <Icon name="youtube-music" size={20} />
        </a>
      </header>

      <div className="mp-pill">
        <button type="button" className="mp-play" onClick={() => onToggle(i)} aria-label={isPlaying ? `Pause ${title}` : `Play ${title}`} data-cursor-snap>
          <Icon name={isPlaying ? "pause" : "play"} size={18} className="mp-fill" />
        </button>

        <div
          ref={wave}
          className="mp-wave"
          role="slider"
          tabIndex={0}
          aria-label={`Seek ${title}`}
          aria-valuemin={0}
          aria-valuemax={Math.round(dur) || 0}
          aria-valuenow={Math.round(elapsed) || 0}
          aria-valuetext={`${fmt(elapsed)}${dur ? ` of ${fmt(dur)}` : ""}`}
          onPointerDown={down}
          onPointerMove={move}
          onPointerUp={up}
          onPointerCancel={cancel}
          onKeyDown={key}
        >
          {bars.map((h, k) => (
            <span
              key={k}
              className={`mp-bar${k < head ? " on" : ""}${k === head && isActive ? " head" : ""}`}
              style={{ "--h": h, "--i": k } as React.CSSProperties}
            />
          ))}
        </div>

        <span className="mp-time" aria-hidden>
          {isActive ? fmt(elapsed) : dur ? fmt(dur) : "–:––"}
          {isActive && dur ? <em> / {fmt(dur)}</em> : null}
        </span>
      </div>

      {bad && (
        <p className="mp-err" role="status">
          This song can't be played here.{" "}
          <a href={ytMusicUrl(id)} target="_blank" rel="noopener noreferrer">
            Open it in YouTube Music
          </a>
        </p>
      )}
    </article>
  );
});

/* ───────── the whole section ───────── */

export default function MusicSection() {
  const { tracks, playlist } = music;

  const [active, setActive] = useState(0);
  const [started, setStarted] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [cur, setCur] = useState(0);
  const [durs, setDurs] = useState<Record<number, number>>({});
  const [bad, setBad] = useState<Record<number, boolean>>({});
  const [imgOk, setImgOk] = useState(true);

  const root = useRef<HTMLDivElement>(null);
  const host = useRef<HTMLDivElement>(null);
  const img = useRef<HTMLImageElement>(null);
  const player = useRef<any>(null);
  const ready = useRef(false);
  const alive = useRef(false);
  const activeRef = useRef(0);
  const pending = useRef<number | null>(null);
  const starting = useRef(false);

  // an image that failed before React attached the onError handler
  useEffect(() => {
    const el = img.current;
    if (el && el.complete && el.naturalWidth === 0) setImgOk(false);
  }, []);

  const setMedia = useCallback(
    (i: number) => {
      if (typeof navigator === "undefined" || !("mediaSession" in navigator)) return;
      try {
        navigator.mediaSession.metadata = new MediaMetadata({ title: tracks[i].title, artist: tracks[i].artist, album: playlist.title });
        navigator.mediaSession.setActionHandler("play", () => player.current?.playVideo());
        navigator.mediaSession.setActionHandler("pause", () => player.current?.pauseVideo());
      } catch {
        /* not supported */
      }
    },
    [tracks, playlist.title],
  );

  const playIndex = useCallback(
    (i: number) => {
      const p = player.current;
      if (!p || !ready.current) return;
      activeRef.current = i;
      setActive(i);
      setCur(0);
      setBad((b) => (b[i] ? { ...b, [i]: false } : b));
      p.loadVideoById(tracks[i].id);
      setMedia(i);
    },
    [tracks, setMedia],
  );

  /** Create the (invisible) YouTube player. Called when the section is near the screen, or on the first click. */
  const ensure = useCallback(() => {
    if (player.current || starting.current || !host.current) return;
    starting.current = true;
    loadYT()
      .then((YT) => {
        if (!alive.current || player.current || !host.current) return;
        const el = document.createElement("div");
        host.current.appendChild(el);
        player.current = new YT.Player(el, {
          width: "200",
          height: "200",
          videoId: tracks[0].id,
          playerVars: { playsinline: 1, controls: 0, disablekb: 1, rel: 0, fs: 0, iv_load_policy: 3, origin: window.location.origin },
          events: {
            onReady: () => {
              ready.current = true;
              const i = pending.current;
              pending.current = null;
              if (i !== null) {
                if (i === 0) {
                  player.current.playVideo();
                  setMedia(0);
                } else playIndex(i);
              }
            },
            onStateChange: (e: any) => {
              const p = player.current;
              if (!p) return;
              const s = e.data;
              if (s === 1 || s === 3) {
                setPlaying(true);
                const d = p.getDuration?.();
                if (d) setDurs((o) => (o[activeRef.current] === d ? o : { ...o, [activeRef.current]: d }));
              } else if (s === 2) {
                setPlaying(false);
                setCur(p.getCurrentTime?.() ?? 0);
              } else if (s === 0) {
                setPlaying(false);
                const next = activeRef.current + 1;
                if (next < tracks.length) playIndex(next);
                else setCur(0);
              }
            },
            onError: () => {
              setPlaying(false);
              setBad((b) => ({ ...b, [activeRef.current]: true }));
            },
          },
        });
      })
      .catch(() => {
        starting.current = false;
        setBad((b) => ({ ...b, [activeRef.current]: true }));
        setPlaying(false);
      });
  }, [tracks, playIndex, setMedia]);

  useEffect(() => {
    alive.current = true;
    const el = root.current;
    let io: IntersectionObserver | undefined;
    if (el) {
      io = new IntersectionObserver(
        ([e]) => {
          if (e.isIntersecting) {
            io?.disconnect();
            ensure();
          }
        },
        { rootMargin: "500px 0px" },
      );
      io.observe(el);
    }
    return () => {
      alive.current = false;
      io?.disconnect();
      try {
        player.current?.destroy?.();
      } catch {
        /* ignore */
      }
      player.current = null;
      ready.current = false;
      starting.current = false;
      if (host.current) host.current.innerHTML = "";
    };
  }, [ensure]);

  // progress: ask the player for the time while a song is playing
  useEffect(() => {
    if (!playing) return;
    const t = window.setInterval(() => {
      const p = player.current;
      if (!p || !ready.current) return;
      setCur(p.getCurrentTime?.() ?? 0);
      const d = p.getDuration?.();
      if (d) setDurs((o) => (o[activeRef.current] === d ? o : { ...o, [activeRef.current]: d }));
    }, 250);
    return () => window.clearInterval(t);
  }, [playing]);

  const onToggle = useCallback(
    (i: number) => {
      const p = player.current;
      setStarted(true);
      if (!p || !ready.current) {
        // the player is still loading: remember the click and start as soon as it is ready
        pending.current = i;
        activeRef.current = i;
        setActive(i);
        setPlaying(true);
        ensure();
        return;
      }
      if (i === activeRef.current) {
        const st = p.getPlayerState?.();
        if (st === 1 || st === 3) p.pauseVideo();
        else {
          setBad((b) => (b[i] ? { ...b, [i]: false } : b));
          p.playVideo();
        }
      } else {
        playIndex(i);
      }
    },
    [ensure, playIndex],
  );

  const onSeek = useCallback((i: number, ratio: number) => {
    const p = player.current;
    if (!p || !ready.current || i !== activeRef.current) return;
    const d = p.getDuration?.() || 0;
    if (!d) return;
    p.seekTo(ratio * d, true);
    setCur(ratio * d);
  }, []);

  const nowPlaying = playing;

  return (
    <div ref={root} className="mp">
      <div ref={host} className="mp-yt" aria-hidden />

      <Reveal variant="scale" className="mp-side">
        <Tilt className="pl-card spot" max={4} scale={1.01}>
          <div className="pl-in">
            <div className="pl-art">
              {imgOk ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img ref={img} src={playlist.cover} alt={`${playlist.title} cover`} loading="lazy" decoding="async" onError={() => setImgOk(false)} />
              ) : (
                <div className="pl-ph" aria-hidden>
                  <Icon name="music" size={64} stroke={1.1} />
                </div>
              )}
              <span className="pl-tag">
                <Icon name="music" size={14} /> Playlist
              </span>
              <span className={`pl-now${nowPlaying ? " on" : ""}`}>
                <Eq on={nowPlaying} /> Now playing
              </span>
            </div>

            <div className="pl-body">
              <h3 className="pl-title">{playlist.title}</h3>
              <p className="pl-desc">{playlist.description}</p>
              <p className="pl-meta">{tracks.length} featured songs</p>

              <div className="pl-btns">
                <Magnetic strength={0.18}>
                  <a className="btn btn-solid" href={playlist.youtubeMusic} target="_blank" rel="noopener noreferrer" data-cursor="Open">
                    <Icon name="youtube-music" size={20} /> YouTube Music
                  </a>
                </Magnetic>
                <Magnetic strength={0.18}>
                  <a className="btn" href={playlist.spotify} target="_blank" rel="noopener noreferrer" data-cursor="Open">
                    <Icon name="spotify" size={20} /> Spotify
                  </a>
                </Magnetic>
              </div>
            </div>
          </div>
        </Tilt>
      </Reveal>

      <ul className="mp-list">
        {tracks.map((t, i) => (
          <Reveal as="li" key={`${t.id}-${i}`} delay={i * 90} variant="up">
            <TrackCard
              i={i}
              id={t.id}
              title={t.title}
              artist={t.artist}
              isActive={started && active === i}
              playing={playing}
              cur={active === i ? cur : 0}
              dur={durs[i] ?? 0}
              bad={!!bad[i]}
              onToggle={onToggle}
              onSeek={onSeek}
            />
          </Reveal>
        ))}
      </ul>
    </div>
  );
}