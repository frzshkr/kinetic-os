// Web Speech Synthesis wrapper for Waze-style voice alerts & AI voice feedback

class VoiceEngine {
  private isEnabled: boolean = true;
  private language: string = 'en-US';

  public setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
  }

  public setLanguage(lang: string) {
    this.language = lang;
  }

  public speak(text: string, force: boolean = false) {
    if (!this.isEnabled && !force) return;
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = this.language;
      utterance.rate = 1.05;
      utterance.pitch = 1.0;

      const voices = window.speechSynthesis.getVoices();
      const preferred = voices.find((v) => v.lang.startsWith(this.language.slice(0, 2)));
      if (preferred) {
        utterance.voice = preferred;
      }

      window.speechSynthesis.speak(utterance);
    } catch {}
  }

  public speakManeuver(instruction: string, distanceMeters: number) {
    if (!this.isEnabled) return;
    const distText =
      distanceMeters > 500
        ? `In ${(distanceMeters / 1000).toFixed(1)} kilometers`
        : `In ${Math.round(distanceMeters)} meters`;
    this.speak(`${distText}, ${instruction}`);
  }
}

export const voice = new VoiceEngine();
