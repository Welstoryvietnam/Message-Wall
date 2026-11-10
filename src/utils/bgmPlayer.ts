// Welstory Kids' Day Background Music Player
// Supports external audio file (MP3 / WAV / OGG / M4A) with loop and seamless browser autoplay handling,
// with graceful fallback to synthesized music-box chimes if no audio file is provided.

export const DEFAULT_BGM_FILE_PATH = '/assets/aistudio/Kh_t_v_ng_Welstory_ecbc15e6.mp3';

class WelstoryBgmPlayer {
  private audioElement: HTMLAudioElement | null = null;
  private isPlaying = false;
  private userManuallyStopped = false;
  private customAudioSrc: string = DEFAULT_BGM_FILE_PATH;

  // Fallback Web Audio synth
  private ctx: AudioContext | null = null;
  private gainNode: GainNode | null = null;
  private timerId: number | null = null;
  private noteIndex = 0;
  private volume = 0.35;

  private melodyNotes: { freq: number; dur: number; rest: number }[] = [
    { freq: 349.23, dur: 0.35, rest: 0.1 },  // F4
    { freq: 440.00, dur: 0.35, rest: 0.1 },  // A4
    { freq: 523.25, dur: 0.45, rest: 0.15 }, // C5
    { freq: 587.33, dur: 0.45, rest: 0.2 },  // D5
    { freq: 523.25, dur: 0.60, rest: 0.3 },  // C5
    { freq: 440.00, dur: 0.30, rest: 0.1 },  // A4
    { freq: 392.00, dur: 0.30, rest: 0.1 },  // G4
    { freq: 440.00, dur: 0.35, rest: 0.1 },  // A4
    { freq: 349.23, dur: 0.70, rest: 0.35 }, // F4
    { freq: 392.00, dur: 0.30, rest: 0.1 },  // G4
    { freq: 440.00, dur: 0.30, rest: 0.1 },  // A4
    { freq: 523.25, dur: 0.35, rest: 0.1 },  // C5
    { freq: 659.25, dur: 0.45, rest: 0.15 }, // E5
    { freq: 587.33, dur: 0.55, rest: 0.25 }, // D5
    { freq: 523.25, dur: 0.35, rest: 0.1 },  // C5
    { freq: 440.00, dur: 0.35, rest: 0.1 },  // A4
    { freq: 392.00, dur: 0.40, rest: 0.15 }, // G4
    { freq: 349.23, dur: 0.90, rest: 0.6 },  // F4
  ];

  constructor() {
    if (typeof window !== 'undefined') {
      this.initAudioElement();
    }
  }

  private initAudioElement() {
    if (this.audioElement) return;
    try {
      const audio = new Audio();
      audio.src = this.customAudioSrc;
      audio.loop = true;
      audio.volume = this.volume;
      audio.preload = 'auto';

      audio.addEventListener('play', () => {
        this.isPlaying = true;
      });

      audio.addEventListener('pause', () => {
        if (this.userManuallyStopped) {
          this.isPlaying = false;
        }
      });

      audio.addEventListener('error', () => {
        // If file not found yet, we fallback to synth smoothly
        console.warn('Audio file not found or cannot be loaded yet, fallback to synth.');
      });

      this.audioElement = audio;
    } catch {
      // Audio element not supported
    }
  }

  public setAudioSource(src: string) {
    this.customAudioSrc = src;
    if (this.audioElement) {
      const wasPlaying = this.isPlaying;
      this.audioElement.src = src;
      this.audioElement.load();
      if (wasPlaying && !this.userManuallyStopped) {
        this.audioElement.play().catch(() => {});
      }
    }
  }

  private getAudioContext(): AudioContext {
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  private playSynthTone(freq: number, duration: number) {
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const oscGain = this.ctx.createGain();
      const harmonic = this.ctx.createOscillator();
      const harmonicGain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);

      harmonic.type = 'triangle';
      harmonic.frequency.setValueAtTime(freq * 2, now);

      oscGain.gain.setValueAtTime(0.001, now);
      oscGain.gain.exponentialRampToValueAtTime(0.25, now + 0.02);
      oscGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

      harmonicGain.gain.setValueAtTime(0.001, now);
      harmonicGain.gain.exponentialRampToValueAtTime(0.06, now + 0.02);
      harmonicGain.gain.exponentialRampToValueAtTime(0.0001, now + duration * 0.7);

      if (this.gainNode) {
        osc.connect(oscGain);
        harmonic.connect(harmonicGain);
        oscGain.connect(this.gainNode);
        harmonicGain.connect(this.gainNode);
      }

      osc.start(now);
      harmonic.start(now);
      osc.stop(now + duration + 0.05);
      harmonic.stop(now + duration + 0.05);
    } catch {
      // Audio catch
    }
  }

  private scheduleSynth() {
    if (!this.isPlaying || this.userManuallyStopped) return;
    const current = this.melodyNotes[this.noteIndex];
    this.playSynthTone(current.freq, current.dur);

    const stepMs = (current.dur + current.rest) * 1000;
    this.noteIndex = (this.noteIndex + 1) % this.melodyNotes.length;

    this.timerId = window.setTimeout(() => {
      this.scheduleSynth();
    }, stepMs);
  }

  public async play(): Promise<boolean> {
    this.userManuallyStopped = false;
    this.initAudioElement();

    if (this.audioElement && this.audioElement.src) {
      try {
        await this.audioElement.play();
        this.isPlaying = true;
        return true;
      } catch {
        // Autoplay policy or file not ready: fallback to web audio synth
        try {
          const ctx = this.getAudioContext();
          if (!this.gainNode) {
            this.gainNode = ctx.createGain();
            this.gainNode.gain.setValueAtTime(this.volume, ctx.currentTime);
            this.gainNode.connect(ctx.destination);
          }
          this.isPlaying = true;
          this.scheduleSynth();
          return true;
        } catch {
          return false;
        }
      }
    }
    return false;
  }

  public pause() {
    this.userManuallyStopped = true;
    this.isPlaying = false;

    if (this.audioElement) {
      this.audioElement.pause();
    }
    if (this.timerId !== null) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
  }

  public toggle(): boolean {
    if (this.isPlaying) {
      this.pause();
      return false;
    } else {
      this.play();
      return true;
    }
  }

  public getIsPlaying(): boolean {
    return this.isPlaying;
  }

  public isUserStopped(): boolean {
    return this.userManuallyStopped;
  }

  // Attempt autoplay safely upon first user interaction if not manually stopped
  public setupAutoPlayOnInteraction(onPlayingChanged?: (playing: boolean) => void) {
    if (typeof window === 'undefined') return;

    // First try direct play
    this.play().then((ok) => {
      if (ok && onPlayingChanged) onPlayingChanged(true);
    });

    const triggerPlay = () => {
      if (this.userManuallyStopped || this.isPlaying) return;
      this.play().then((ok) => {
        if (ok && onPlayingChanged) onPlayingChanged(true);
      });
      // Remove once successfully initiated
      window.removeEventListener('pointerdown', triggerPlay);
      window.removeEventListener('keydown', triggerPlay);
      window.removeEventListener('scroll', triggerPlay);
    };

    window.addEventListener('pointerdown', triggerPlay, { once: false, passive: true });
    window.addEventListener('keydown', triggerPlay, { once: false, passive: true });
    window.addEventListener('scroll', triggerPlay, { once: false, passive: true });
  }
}

export const bgmPlayer = new WelstoryBgmPlayer();
