// Browser speech recognition type definitions
interface IWindowSpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: any) => void) | null;
  onerror: ((event: any) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
}

declare global {
  interface Window {
    webkitSpeechRecognition?: any;
    SpeechRecognition?: any;
    webkitAudioContext?: typeof AudioContext;
  }
}

export class AudioService {
  private mediaRecorder: MediaRecorder | null = null;
  private audioStream: MediaStream | null = null;
  private recordedChunks: Blob[] = [];
  private currentAudioElement: HTMLAudioElement | null = null;
  public isRecording: boolean = false;
  private recognition: IWindowSpeechRecognition | null = null;
  private isSpeechRecognitionActive: boolean = false;
  private playbackGeneration: number = 0;
  private isMutedOrStopped: boolean = false;
  private audioCtx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private animFrameId: number | null = null;

  async requestMicrophone(): Promise<MediaStream> {
    if (this.audioStream && this.audioStream.active) {
      return this.audioStream;
    }
    try {
      this.audioStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      return this.audioStream;
    } catch (error) {
      console.warn('Microphone permission not granted:', error);
      throw new Error('Microphone access was denied or is unavailable.');
    }
  }

  async startRecording(
    onDataAvailable?: (blob: Blob) => void,
    onAudioLevel?: (volume: number) => void
  ): Promise<void> {
    this.stopPlayback();
    const stream = await this.requestMicrophone();
    this.recordedChunks = [];
    this.isRecording = true;

    // Start Audio Level Analyser for Visualizer & Silence Detection
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        if (!this.audioCtx || this.audioCtx.state === 'closed') {
          this.audioCtx = new AudioContextClass();
        }
        if (this.audioCtx.state === 'suspended') {
          await this.audioCtx.resume();
        }
        const source = this.audioCtx.createMediaStreamSource(stream);
        this.analyser = this.audioCtx.createAnalyser();
        this.analyser.fftSize = 256;
        source.connect(this.analyser);

        const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
        const checkLevel = () => {
          if (!this.isRecording || !this.analyser) return;
          this.analyser.getByteFrequencyData(dataArray);
          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i];
          }
          const avg = sum / dataArray.length;
          if (onAudioLevel) {
            onAudioLevel(avg);
          }
          this.animFrameId = requestAnimationFrame(checkLevel);
        };
        checkLevel();
      }
    } catch (e) {
      console.warn('Audio level monitoring initialization warning:', e);
    }

    let mimeType = 'audio/webm';
    if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
      mimeType = 'audio/webm;codecs=opus';
    } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
      mimeType = 'audio/mp4';
    } else if (MediaRecorder.isTypeSupported('audio/wav')) {
      mimeType = 'audio/wav';
    }

    try {
      this.mediaRecorder = new MediaRecorder(stream, { mimeType });
    } catch {
      this.mediaRecorder = new MediaRecorder(stream);
    }

    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) {
        this.recordedChunks.push(event.data);
        if (onDataAvailable) {
          onDataAvailable(event.data);
        }
      }
    };

    this.mediaRecorder.start(250);
  }

  async stopRecording(): Promise<{ blob: Blob; base64: string; mimeType: string }> {
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }

    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder || this.mediaRecorder.state === 'inactive') {
        this.isRecording = false;
        if (this.recordedChunks.length > 0) {
          const mime = 'audio/webm';
          const blob = new Blob(this.recordedChunks, { type: mime });
          this.recordedChunks = [];
          this.blobToBase64(blob)
            .then((base64) => resolve({ blob, base64, mimeType: mime }))
            .catch(reject);
          return;
        }
        reject(new Error('MediaRecorder is not active'));
        return;
      }

      this.mediaRecorder.onstop = async () => {
        this.isRecording = false;
        const mimeType = this.mediaRecorder?.mimeType || 'audio/webm';
        const combinedBlob = new Blob(this.recordedChunks, { type: mimeType });
        this.recordedChunks = [];

        try {
          const base64 = await this.blobToBase64(combinedBlob);
          resolve({
            blob: combinedBlob,
            base64,
            mimeType,
          });
        } catch (err) {
          reject(err);
        }
      };

      try {
        this.mediaRecorder.stop();
      } catch (e) {
        this.isRecording = false;
        reject(e);
      }
    });
  }

  private blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const res = (reader.result as string) || '';
        const base64 = res.includes(',') ? res.split(',')[1] : res;
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  playAudioOrSpeak(
    audioBase64: string | undefined,
    mimeType: string = 'audio/mpeg',
    fallbackText: string,
    language: string = 'en',
    onEnded?: () => void
  ) {
    this.stopPlayback();
    this.isMutedOrStopped = false;
    const currentGen = ++this.playbackGeneration;

    const safeOnEnded = () => {
      if (this.playbackGeneration === currentGen && !this.isMutedOrStopped && onEnded) {
        onEnded();
      }
    };

    if (audioBase64 && audioBase64.length > 50) {
      this.playAudioBase64(audioBase64, mimeType, currentGen, safeOnEnded).catch(() => {
        if (this.playbackGeneration === currentGen && !this.isMutedOrStopped) {
          this.speakWithBrowserTTS(fallbackText, language, currentGen, safeOnEnded);
        }
      });
    } else {
      this.speakWithBrowserTTS(fallbackText, language, currentGen, safeOnEnded);
    }
  }

  async playAudioBase64(
    base64Data: string,
    mimeType: string = 'audio/mpeg',
    gen: number,
    onEnded?: () => void
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        if (this.isMutedOrStopped || this.playbackGeneration !== gen) {
          return resolve();
        }

        const byteCharacters = atob(base64Data);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: mimeType });
        const audioUrl = URL.createObjectURL(blob);

        const audio = new Audio(audioUrl);
        this.currentAudioElement = audio;

        let finished = false;

        const complete = (isError?: boolean, err?: any) => {
          if (finished) return;
          finished = true;
          URL.revokeObjectURL(audioUrl);
          if (this.currentAudioElement === audio) {
            this.currentAudioElement = null;
          }
          if (isError) {
            reject(err);
          } else {
            resolve();
          }
          if (this.playbackGeneration === gen && !this.isMutedOrStopped && onEnded) {
            onEnded();
          }
        };

        audio.onended = () => complete(false);
        audio.onerror = (e) => complete(true, e);

        audio.play().catch((err) => {
          console.warn('Playback play() promise rejected:', err);
          complete(true, err);
        });
      } catch (err) {
        console.warn('Error constructing audio buffer:', err);
        reject(err);
      }
    });
  }

  speakWithBrowserTTS(
    text: string,
    language: string = 'en',
    gen: number,
    onEnded?: () => void
  ): void {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      if (onEnded) onEnded();
      return;
    }

    if (this.isMutedOrStopped || this.playbackGeneration !== gen) {
      return;
    }

    try {
      window.speechSynthesis.cancel();

      const cleanText = text.replace(/[\n\r*#_]+/g, ' ').trim();
      if (!cleanText) {
        if (onEnded) onEnded();
        return;
      }

      const utterance = new SpeechSynthesisUtterance(cleanText);
      const isHindi = language === 'hi' || /[\u0900-\u097F]/.test(cleanText);
      utterance.lang = isHindi ? 'hi-IN' : 'en-US';
      utterance.rate = 0.95;
      utterance.pitch = 1.0;

      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        const matchingVoice = voices.find(
          (v) => (isHindi ? v.lang.startsWith('hi') : v.lang.startsWith('en'))
        );
        if (matchingVoice) {
          utterance.voice = matchingVoice;
        }
      }

      let doneFired = false;
      const finish = () => {
        if (!doneFired) {
          doneFired = true;
          if (this.playbackGeneration === gen && !this.isMutedOrStopped && onEnded) {
            onEnded();
          }
        }
      };

      utterance.onend = finish;
      utterance.onerror = finish;

      const estimatedMs = Math.max(2500, (cleanText.length / 12) * 1000);
      setTimeout(() => {
        if (!doneFired && this.playbackGeneration === gen && !this.isMutedOrStopped) {
          finish();
        }
      }, estimatedMs + 2000);

      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('Browser SpeechSynthesis error:', e);
    }
  }

  startSpeechRecognition(
    onResult: (transcript: string, isFinal: boolean) => void,
    onEnd?: () => void,
    language: string = 'en'
  ): boolean {
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) {
      return false;
    }

    this.stopSpeechRecognition();

    try {
      const recognition = new SpeechRecognitionAPI();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;
      recognition.lang = language === 'hi' ? 'hi-IN' : 'en-US';

      recognition.onresult = (event: any) => {
        let fullTranscript = '';
        for (let i = 0; i < event.results.length; ++i) {
          const item = event.results[i];
          if (item && item[0] && item[0].transcript) {
            fullTranscript += item[0].transcript + ' ';
          }
        }
        const clean = fullTranscript.trim();
        if (clean) {
          const isFinal = Boolean(event.results[event.results.length - 1]?.isFinal);
          onResult(clean, isFinal);
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('SpeechRecognition error:', event?.error);
      };

      recognition.onend = () => {
        this.isSpeechRecognitionActive = false;
        if (onEnd) onEnd();
      };

      recognition.start();
      this.recognition = recognition;
      this.isSpeechRecognitionActive = true;
      return true;
    } catch (err) {
      console.warn('Could not start browser speech recognition:', err);
      return false;
    }
  }

  stopSpeechRecognition(): void {
    if (this.recognition && this.isSpeechRecognitionActive) {
      try {
        this.recognition.stop();
      } catch {
        // ignore
      }
      this.recognition = null;
      this.isSpeechRecognitionActive = false;
    }
  }

  stopPlayback(): void {
    this.playbackGeneration++;
    this.isMutedOrStopped = true;

    if (this.currentAudioElement) {
      try {
        this.currentAudioElement.pause();
        this.currentAudioElement.currentTime = 0;
        this.currentAudioElement.src = '';
      } catch {
        // ignore
      }
      this.currentAudioElement = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // ignore
      }
    }
  }

  cleanup(): void {
    this.stopPlayback();
    this.stopSpeechRecognition();
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      try {
        this.mediaRecorder.stop();
      } catch {
        // ignore
      }
    }
    if (this.audioStream) {
      try {
        this.audioStream.getTracks().forEach((track) => track.stop());
      } catch {
        // ignore
      }
      this.audioStream = null;
    }
  }
}

export const audioService = new AudioService();
