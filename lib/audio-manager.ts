import { Howl } from 'howler';

export const AUDIO_ASSETS = {
  lobby: 'https://assets.mixkit.co/music/preview/mixkit-tech-house-vibes-130.mp3',
  question: 'https://assets.mixkit.co/music/preview/mixkit-game-show-suspense-waiting-667.mp3',
  correct: 'https://assets.mixkit.co/sfx/preview/mixkit-winning-chime-2064.mp3',
  incorrect: 'https://assets.mixkit.co/sfx/preview/mixkit-negative-answer-741.mp3',
  podium: 'https://assets.mixkit.co/music/preview/mixkit-starlight-607.mp3',
  join: 'https://assets.mixkit.co/sfx/preview/mixkit-light-button-2580.mp3',
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
