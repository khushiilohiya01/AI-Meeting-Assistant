import { io, Socket } from 'socket.io-client';
import { CAPTURE_SOCKET_URL } from './api';

export type AudioSourceMode = 'mic' | 'tab' | 'both';

export interface CaptureState {
  isCapturing: boolean;
  isFinalizing: boolean;
  meetingId: string | null;
  sessionId: string | null;
  elapsedSeconds: number;
  audioSource: AudioSourceMode;
  hasTabAudio: boolean;
  hasMicAudio: boolean;
  packetsSent: number;
  volumeLevel: number;
  liveSegments: Array<{ text: string; sequenceNumber: number }>;
  lastInsight: {
    topics?: string[];
    keyPoints?: string[];
    draftDecisions?: string[];
    candidateActionItems?: any[];
  } | null;
  error: string | null;
}

export class MeetingAudioCaptureController {
  private socket: Socket | null = null;
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private displayStream: MediaStream | null = null;
  private micStream: MediaStream | null = null;
  private processorNode: AudioNode | null = null;
  private timerInterval: NodeJS.Timeout | null = null;
  private volumeInterval: NodeJS.Timeout | null = null;

  private sequenceNumber = 0;
  private packetsSent = 0;
  private elapsedSeconds = 0;
  private meetingId: string | null = null;
  private sessionId: string | null = null;
  private audioSource: AudioSourceMode = 'mic';
  private liveSegments: Array<{ text: string; sequenceNumber: number }> = [];

  private currentState: CaptureState = {
    isCapturing: false,
    isFinalizing: false,
    meetingId: null,
    sessionId: null,
    elapsedSeconds: 0,
    audioSource: 'mic',
    hasTabAudio: false,
    hasMicAudio: false,
    packetsSent: 0,
    volumeLevel: 0,
    liveSegments: [],
    lastInsight: null,
    error: null,
  };

  private onStateChange: ((state: CaptureState) => void) | null = null;
  private onReady: ((reportId: string) => void) | null = null;
  private onError: ((err: string) => void) | null = null;

  async start(options: {
    meetingId: string;
    audioSource?: AudioSourceMode;
    onStateChange: (state: CaptureState) => void;
    onReady: (reportId: string) => void;
    onError: (err: string) => void;
  }): Promise<boolean> {
    this.meetingId = options.meetingId;
    this.audioSource = options.audioSource || 'mic';
    this.onStateChange = options.onStateChange;
    this.onReady = options.onReady;
    this.onError = options.onError;
    this.sequenceNumber = 0;
    this.packetsSent = 0;
    this.elapsedSeconds = 0;
    this.liveSegments = [];

    this.currentState = {
      isCapturing: false,
      isFinalizing: false,
      meetingId: this.meetingId,
      sessionId: null,
      elapsedSeconds: 0,
      audioSource: this.audioSource,
      hasTabAudio: false,
      hasMicAudio: false,
      packetsSent: 0,
      volumeLevel: 0,
      liveSegments: [],
      lastInsight: null,
      error: null,
    };

    let displayAudioTrack: MediaStreamTrack | null = null;
    let micAudioTrack: MediaStreamTrack | null = null;

    // 1. Capture Microphone if 'mic' or 'both'
    if (this.audioSource === 'mic' || this.audioSource === 'both') {
      try {
        this.micStream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });
        const micTracks = this.micStream.getAudioTracks();
        if (micTracks.length > 0) {
          micAudioTrack = micTracks[0];
        }
      } catch (err: any) {
        if (this.audioSource === 'mic') {
          const msg =
            err.name === 'NotAllowedError'
              ? 'Microphone permission was denied. Please allow microphone access in your browser.'
              : `Microphone access error: ${err.message}`;
          this.emitError(msg);
          return false;
        }
        console.warn('Microphone permission not granted:', err);
      }
    }

    // 2. Capture Screen/Tab Audio if 'tab' or 'both'
    if (this.audioSource === 'tab' || this.audioSource === 'both') {
      try {
        this.displayStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: {
            echoCancellation: false,
            noiseSuppression: false,
            autoGainControl: false,
          },
        });

        const audioTracks = this.displayStream.getAudioTracks();
        if (audioTracks.length > 0) {
          displayAudioTrack = audioTracks[0];
        } else if (this.audioSource === 'tab') {
          this.cleanupStreams();
          this.emitError(
            'No tab audio track was found. When sharing your meeting tab, please make sure to check the "Also share tab audio" checkbox.',
          );
          return false;
        }
      } catch (err: any) {
        if (this.audioSource === 'tab') {
          const msg =
            err.name === 'NotAllowedError'
              ? 'Tab sharing was cancelled or denied.'
              : `Screen/Tab capture error: ${err.message}`;
          this.emitError(msg);
          return false;
        }
        console.warn('Tab audio not captured:', err);
      }
    }

    // Validate that at least one audio stream is present
    if (!displayAudioTrack && !micAudioTrack) {
      this.cleanupStreams();
      this.emitError(
        'No active audio input detected. Please allow microphone access or check "Share tab audio" when sharing a tab.',
      );
      return false;
    }

    // 3. Connect Socket.IO client
    try {
      this.socket = io(CAPTURE_SOCKET_URL, {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 5,
      });

      this.socket.on('connect', () => {
        this.socket?.emit('capture:join', { meetingId: this.meetingId });
      });

      this.socket.on('capture:status', (data) => {
        this.sessionId = data.sessionId;
        this.emitState({ isCapturing: true, isFinalizing: false, sessionId: data.sessionId });
      });

      this.socket.on('transcript:segment', (segment) => {
        if (segment?.text) {
          this.liveSegments.push({
            text: segment.text,
            sequenceNumber: segment.sequenceNumber || this.liveSegments.length + 1,
          });
          this.emitState({ liveSegments: [...this.liveSegments] });
        }
      });

      this.socket.on('insights:update', (insights) => {
        this.emitState({ lastInsight: insights });
      });

      this.socket.on('meeting:finalizing', () => {
        this.emitState({ isFinalizing: true });
      });

      this.socket.on('meeting:ready', (data) => {
        this.stopLocalMedia();
        if (this.onReady && data.reportId) {
          this.onReady(data.reportId);
        }
      });

      this.socket.on('capture:error', (data) => {
        this.emitError(data?.message || 'Capture socket error');
      });
    } catch (err: any) {
      this.cleanupStreams();
      this.emitError(`Could not connect to capture gateway: ${err.message}`);
      return false;
    }

    // 4. Setup AudioContext & Mixing at 24,000 Hz
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.audioContext = new AudioCtx({ sampleRate: 24000 });

      // Destination for mixed mono audio
      const merger = this.audioContext.createChannelMerger(2);

      if (displayAudioTrack) {
        const tabSource = this.audioContext.createMediaStreamSource(
          new MediaStream([displayAudioTrack]),
        );
        const tabGain = this.audioContext.createGain();
        tabGain.gain.value = 1.0;
        tabSource.connect(tabGain);
        tabGain.connect(merger, 0, 0);
      }

      if (micAudioTrack) {
        const micSource = this.audioContext.createMediaStreamSource(
          new MediaStream([micAudioTrack]),
        );
        const micGain = this.audioContext.createGain();
        micGain.gain.value = 1.0;
        micSource.connect(micGain);
        micGain.connect(merger, 0, 1);
      }

      // Analyser Node for Live VU / Volume Meter
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 256;
      merger.connect(this.analyser);

      // Volume monitoring interval (every 70ms)
      const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
      this.volumeInterval = setInterval(() => {
        if (!this.analyser) return;
        this.analyser.getByteTimeDomainData(dataArray);
        let sumSquares = 0;
        for (let i = 0; i < dataArray.length; i++) {
          const norm = (dataArray[i] - 128) / 128;
          sumSquares += norm * norm;
        }
        const rms = Math.sqrt(sumSquares / dataArray.length);
        const volumeLevel = Math.min(100, Math.round(rms * 280));
        this.emitState({ volumeLevel });
      }, 70);

      // 5. PCM16 Encoder Processor
      const bufferSize = 4096;
      const scriptNode = this.audioContext.createScriptProcessor(bufferSize, 2, 1);

      scriptNode.onaudioprocess = (e) => {
        if (!this.socket?.connected || !this.meetingId) return;

        const left = e.inputBuffer.getChannelData(0);
        const right = e.inputBuffer.numberOfChannels > 1 ? e.inputBuffer.getChannelData(1) : left;

        // Downmix to mono and convert Float32 [-1.0, 1.0] to signed Int16 [-32768, 32767]
        const sampleCount = left.length;
        const pcm16 = new Int16Array(sampleCount);

        for (let i = 0; i < sampleCount; i++) {
          const mixed = (left[i] + right[i]) * 0.5;
          const s = Math.max(-1, Math.min(1, mixed));
          pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
        }

        this.sequenceNumber += 1;
        this.packetsSent += 1;

        // Send binary buffer to backend
        this.socket.emit('capture:audio', {
          meetingId: this.meetingId,
          sessionId: this.sessionId,
          sequenceNumber: this.sequenceNumber,
          audio: pcm16.buffer,
        });

        if (this.packetsSent % 25 === 0) {
          this.emitState({ packetsSent: this.packetsSent });
        }
      };

      merger.connect(scriptNode);
      scriptNode.connect(this.audioContext.destination);
      this.processorNode = scriptNode;

      // Start elapsed timer
      this.timerInterval = setInterval(() => {
        this.elapsedSeconds += 1;
        this.emitState({ elapsedSeconds: this.elapsedSeconds });
      }, 1000);

      this.emitState({
        isCapturing: true,
        isFinalizing: false,
        meetingId: this.meetingId,
        audioSource: this.audioSource,
        hasTabAudio: Boolean(displayAudioTrack),
        hasMicAudio: Boolean(micAudioTrack),
        packetsSent: 0,
        elapsedSeconds: 0,
        volumeLevel: 0,
      });

      return true;
    } catch (err: any) {
      this.cleanupStreams();
      this.emitError(`Audio setup failed: ${err.message}`);
      return false;
    }
  }

  async stop(): Promise<void> {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
    if (this.volumeInterval) {
      clearInterval(this.volumeInterval);
      this.volumeInterval = null;
    }

    this.emitState({ isCapturing: false, isFinalizing: true, volumeLevel: 0 });

    if (this.socket?.connected && this.meetingId) {
      this.socket.emit('capture:stop', { meetingId: this.meetingId });
    }
  }

  private stopLocalMedia() {
    this.cleanupStreams();
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
    if (this.volumeInterval) {
      clearInterval(this.volumeInterval);
      this.volumeInterval = null;
    }
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close();
      this.audioContext = null;
    }
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.emitState({ isCapturing: false, isFinalizing: false, volumeLevel: 0 });
  }

  private cleanupStreams() {
    if (this.displayStream) {
      this.displayStream.getTracks().forEach((t) => t.stop());
      this.displayStream = null;
    }
    if (this.micStream) {
      this.micStream.getTracks().forEach((t) => t.stop());
      this.micStream = null;
    }
  }

  private emitState(partial: Partial<CaptureState>) {
    this.currentState = { ...this.currentState, ...partial };
    if (this.onStateChange) {
      this.onStateChange(this.currentState);
    }
  }

  private emitError(msg: string) {
    if (this.onError) this.onError(msg);
    this.emitState({ error: msg, isCapturing: false, isFinalizing: false, volumeLevel: 0 });
  }
}

export const captureController = new MeetingAudioCaptureController();
