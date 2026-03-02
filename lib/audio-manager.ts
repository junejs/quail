import { Howl } from 'howler';

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
      Object.entries(AUDIO_ASSETS).forEach(([key, url]) => {
        this.sounds.set(key, new Howl({
          src: [url],
          html5: true,
          loop: key === 'lobby' || key === 'question' || key === 'podium',
          volume: 0.5,
        }));
      });
    }
  }

  playBgm(key: keyof typeof AUDIO_ASSETS) {
    if (this.isMuted) return;
    if (this.currentBgm === key) return;

    if (this.currentBgm) {
      this.sounds.get(this.currentBgm)?.fade(0.5, 0, 1000);
      setTimeout(() => {
        this.sounds.get(this.currentBgm!)?.stop();
      }, 1000);
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
      this.sounds.get(this.currentBgm)?.fade(0.5, 0, 1000);
      setTimeout(() => {
        this.sounds.get(this.currentBgm!)?.stop();
        this.currentBgm = null;
      }, 1000);
    }
  }

  playSfx(key: keyof typeof AUDIO_ASSETS) {
    if (this.isMuted) return;
    const sound = this.sounds.get(key);
    if (sound) {
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
