import { Howl, Howler } from 'howler';

export const AUDIO_ASSETS = {
  lobby: '/audio/lobby.mp3',
  question: '/audio/question.mp3',
  correct: '/audio/correct.mp3',
  incorrect: '/audio/incorrect.mp3',
  podium: '/audio/podium.mp3',
  join: '/audio/join.mp3',
};

class AudioManager {
  private sounds: Map<string, Howl> = new Map();
  private currentBgm: string | null = null;
  private queuedBgm: string | null = null;
  private isMuted: boolean = false;
  private isUnlocked: boolean = false;

  constructor() {
    if (typeof window !== 'undefined') {
      // Ensure Howler creates the audio context
      if (!Howler.ctx) {
        Howler.volume(0.8);
      }

      // Global click listener to unlock audio context
      const unlock = () => {
        if (this.isUnlocked) return;
        console.log('User interaction detected, unlocking audio...');
        this.isUnlocked = true;
        this.unlock();
        window.removeEventListener('click', unlock);
        window.removeEventListener('touchstart', unlock);
        window.removeEventListener('keydown', unlock);
      };
      window.addEventListener('click', unlock);
      window.addEventListener('touchstart', unlock);
      window.addEventListener('keydown', unlock);

      Object.entries(AUDIO_ASSETS).forEach(([key, url]) => {
        const isBgm = key === 'lobby' || key === 'question' || key === 'podium';
        this.sounds.set(key, new Howl({
          src: [url],
          html5: false, // Use Web Audio API for all sounds (better autoplay support)
          loop: isBgm,
          volume: 0.8,
          preload: true,
          onload: () => {
            console.log(`Successfully loaded audio: ${key}`);
          },
          onloaderror: (id, error) => {
            console.error(`Failed to load audio: ${key} (${url})`, error);
          },
          onplayerror: (id, error) => {
            // Silence common autoplay errors but log others
            if (typeof error === 'string' && error.includes('interaction')) {
              console.warn(`Autoplay blocked for ${key}, queued for next interaction.`);
              this.queuedBgm = key;
            } else {
              console.error(`Failed to play audio: ${key}`, error);
            }

            // Try to resume context and play again if possible
            this.resumeContext().then(() => {
              if (this.sounds.get(key) && !this.sounds.get(key)?.playing()) {
                this.sounds.get(key)?.play();
              }
            }).catch(() => {});
          }
        }));
      });
    }
  }

  async unlock() {
    await this.resumeContext();
    if (this.queuedBgm) {
      const key = this.queuedBgm as keyof typeof AUDIO_ASSETS;
      this.queuedBgm = null;
      console.log(`Playing queued BGM: ${key}`);
      this.playBgm(key);
    }
  }

  private async resumeContext() {
    if (typeof window === 'undefined') return;

    // Force create audio context on user interaction
    if (!Howler.ctx) {
      Howler.volume(0.8);
      const silentSound = new Howl({ src: ['data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA='] });
      silentSound.play();
      silentSound.stop();
    }

    // Always try to resume
    if (Howler.ctx && Howler.ctx.state !== 'running') {
      try {
        await Howler.ctx.resume();
      } catch (e) {
        console.error('Failed to resume audio context', e);
      }
    }
  }

  async playBgm(key: keyof typeof AUDIO_ASSETS) {
    if (this.isMuted || this.currentBgm === key) return;

    // Stop previous BGM immediately
    if (this.currentBgm) {
      const prevBgm = this.sounds.get(this.currentBgm);
      if (prevBgm) prevBgm.stop();
    }

    await this.resumeContext();

    const sound = this.sounds.get(key);
    if (sound) {
      sound.play();
      this.currentBgm = key;
    }
  }

  stopBgm(keepCurrent: boolean = false) {
    if (this.currentBgm) {
      const sound = this.sounds.get(this.currentBgm);
      if (sound) {
        if (keepCurrent) {
          // Just mute, don't clear currentBgm
          sound.stop();
        } else {
          sound.fade(sound.volume(), 0, 1000);
          setTimeout(() => {
            sound.stop();
            this.currentBgm = null;
          }, 1000);
        }
      }
      if (!keepCurrent) {
        this.currentBgm = null;
      }
    }
  }

  async playSfx(key: keyof typeof AUDIO_ASSETS) {
    console.log(`Attempting to play SFX: ${key}`);
    if (this.isMuted || !this.isUnlocked) return;
    await this.resumeContext();
    const sound = this.sounds.get(key);
    if (sound) {
      if (sound.state() === 'unloaded') {
        sound.load();
      }
      sound.play();
    }
  }

  setMute(mute: boolean) {
    const wasMuted = this.isMuted;
    this.isMuted = mute;
    this.sounds.forEach(sound => sound.mute(mute));

    if (mute) {
      // Mute: stop BGM but keep currentBgm reference for resume
      this.stopBgm(true);
    } else if (wasMuted && this.currentBgm) {
      // Unmute: resume BGM if there was one playing
      const sound = this.sounds.get(this.currentBgm);
      if (sound) {
        sound.play();
      }
    }
  }

  toggleMute() {
    this.setMute(!this.isMuted);
    return this.isMuted;
  }

  getIsUnlocked() {
    return this.isUnlocked;
  }
}

export const audioManager = typeof window !== 'undefined' ? new AudioManager() : null;
