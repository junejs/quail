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
  private isMuted: boolean = false;

  constructor() {
    if (typeof window !== 'undefined') {
      // Global click listener to unlock audio context
      const unlock = () => {
        this.unlock();
        window.removeEventListener('click', unlock);
        window.removeEventListener('touchstart', unlock);
      };
      window.addEventListener('click', unlock);
      window.addEventListener('touchstart', unlock);

      Object.entries(AUDIO_ASSETS).forEach(([key, url]) => {
        const isBgm = key === 'lobby' || key === 'question' || key === 'podium';
        this.sounds.set(key, new Howl({
          src: [url],
          html5: isBgm, // Use HTML5 for BGM (large files), Web Audio for SFX
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
            console.error(`Failed to play audio: ${key}`, error);
            // Try to resume context and play again
            if (Howler.ctx && Howler.ctx.state === 'suspended') {
              Howler.ctx.resume().then(() => {
                this.sounds.get(key)?.play();
              });
            }
          }
        }));
      });
    }
  }

  async unlock() {
    await this.resumeContext();
  }

  private async resumeContext() {
    if (typeof window !== 'undefined' && Howler.ctx && Howler.ctx.state === 'suspended') {
      try {
        await Howler.ctx.resume();
        console.log('Audio context resumed');
      } catch (e) {
        console.error('Failed to resume audio context', e);
      }
    }
  }

  async playBgm(key: keyof typeof AUDIO_ASSETS) {
    console.log(`Attempting to play BGM: ${key}`);
    if (this.isMuted) return;
    if (this.currentBgm === key) return;

    await this.resumeContext();

    if (this.currentBgm) {
      const prevBgm = this.sounds.get(this.currentBgm);
      if (prevBgm && prevBgm.playing()) {
        prevBgm.fade(prevBgm.volume(), 0, 1000);
        setTimeout(() => {
          prevBgm.stop();
        }, 1000);
      }
    }

    const sound = this.sounds.get(key);
    if (sound) {
      sound.volume(0);
      sound.play();
      sound.fade(0, 0.5, 1000);
      this.currentBgm = key;
    }
  }

  stopBgm() {
    if (this.currentBgm) {
      const sound = this.sounds.get(this.currentBgm);
      if (sound) {
        sound.fade(sound.volume(), 0, 1000);
        setTimeout(() => {
          sound.stop();
          this.currentBgm = null;
        }, 1000);
      }
    }
  }

  async playSfx(key: keyof typeof AUDIO_ASSETS) {
    console.log(`Attempting to play SFX: ${key}`);
    if (this.isMuted) return;
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
    this.isMuted = mute;
    this.sounds.forEach(sound => sound.mute(mute));
    if (mute) {
      this.stopBgm();
    }
  }

  toggleMute() {
    this.setMute(!this.isMuted);
    return this.isMuted;
  }
}

export const audioManager = typeof window !== 'undefined' ? new AudioManager() : null;
