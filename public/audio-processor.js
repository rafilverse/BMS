/**
 * IRLock Live — Audio Processor & WAV Encoder
 * Manages Web Audio API context, real-time AnalyserNode, VAD, and standard PCM WAV encoding.
 */

class AudioProcessor {
  constructor() {
    this.audioContext = null;
    this.mediaStream = null;
    this.analyser = null;
    this.sourceNode = null;
    this.scriptProcessor = null;
    this.isRecording = false;
    this.audioChunks = [];
    this.sampleRate = 16000; // Optimal for DetectifAI and Gemini Live
    this.onAudioChunkReady = null;
    this.onVADChange = null;

    // VAD Configuration
    this.vadThreshold = 0.02; // RMS energy threshold for speech
    this.silenceHoldFrames = 25; // ~0.8s silence before dispatching utterance
    this.silenceCounter = 0;
    this.speechActive = false;
  }

  async init(onAudioChunkReady, onVADChange) {
    return this.start(onAudioChunkReady, onVADChange);
  }

  startRecording() {
    this.audioChunks = [];
    this.isRecording = true;
  }

  stopRecording() {
    this.isRecording = false;
    const blob = this.encodeWAV(this.audioChunks, this.sampleRate);
    this.stop();
    return blob;
  }

  getTimeDomainData() {
    if (!this.analyser) return new Uint8Array(0);
    const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteTimeDomainData(dataArray);
    return dataArray;
  }

  async start(onAudioChunkReady, onVADChange) {
    this.onAudioChunkReady = onAudioChunkReady;
    this.onVADChange = onVADChange;

    const constraints = {
      audio: {
        channelCount: 1,
        sampleRate: 16000,
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl: false
      }
    };

    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
    } catch (e) {
      // Fallback with standard constraints if browser refuses unfiltered audio
      this.mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    }

    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    this.audioContext = new AudioContextClass({ sampleRate: 16000 });

    this.sourceNode = this.audioContext.createMediaStreamSource(this.mediaStream);
    this.analyser = this.audioContext.createAnalyser();
    this.analyser.fftSize = 2048;
    this.analyser.smoothingTimeConstant = 0.8;
    this.sourceNode.connect(this.analyser);

    // Buffer processing for audio streaming
    const bufferSize = 4096;
    this.scriptProcessor = this.audioContext.createScriptProcessor(bufferSize, 1, 1);
    this.sourceNode.connect(this.scriptProcessor);
    this.scriptProcessor.connect(this.audioContext.destination);

    this.isRecording = true;
    this.audioChunks = [];

    this.scriptProcessor.onaudioprocess = (e) => {
      if (!this.isRecording) return;
      const inputData = e.inputBuffer.getChannelData(0);
      const bufferCopy = new Float32Array(inputData);
      this.audioChunks.push(bufferCopy);

      // Simple RMS VAD
      let sum = 0;
      for (let i = 0; i < inputData.length; i++) {
        sum += inputData[i] * inputData[i];
      }
      const rms = Math.sqrt(sum / inputData.length);

      this.lastDispatchTime = this.lastDispatchTime || 0;

      if (rms > this.vadThreshold) {
        this.silenceCounter = 0;
        if (!this.speechActive) {
          this.speechActive = true;
          if (this.onVADChange) this.onVADChange(true, rms);
        }

        // Long continuous speech cap: dispatch after ~6.1s (24 buffers) to keep telemetry fresh
        const timeSinceLast = Date.now() - this.lastDispatchTime;
        if (this.audioChunks.length >= 24 && timeSinceLast > 6000) {
          this.dispatchWavChunk();
          return;
        }
      } else {
        if (this.speechActive) {
          this.silenceCounter++;
          if (this.silenceCounter > this.silenceHoldFrames) {
            this.speechActive = false;
            if (this.onVADChange) this.onVADChange(false, rms);
            
            // Dispatch chunk on natural conversational pause (at least 15 buffers ~3.8s for DetectifAI)
            const timeSinceLast = Date.now() - this.lastDispatchTime;
            if (this.audioChunks.length >= 15 && timeSinceLast > 4500) {
              this.dispatchWavChunk();
            }
          }
        }
      }
    };
  }

  stop() {
    this.isRecording = false;
    if (this.scriptProcessor) {
      this.scriptProcessor.disconnect();
      this.scriptProcessor.onaudioprocess = null;
    }
    if (this.sourceNode) {
      this.sourceNode.disconnect();
    }
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
    }
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close();
    }

    if (this.audioChunks.length >= 14) {
      this.dispatchWavChunk();
    }
    this.audioChunks = [];
  }

  dispatchWavChunk() {
    if (this.audioChunks.length < 14) return;
    this.lastDispatchTime = Date.now();
    const wavBlob = this.encodeWAV(this.audioChunks, this.sampleRate);
    
    // Sliding overlap window: retain last 5 buffers (~1.25s) to maintain natural phonetic continuity
    if (this.isRecording && this.audioChunks.length > 5) {
      this.audioChunks = this.audioChunks.slice(-5);
    } else {
      this.audioChunks = [];
    }

    if (this.onAudioChunkReady) {
      this.onAudioChunkReady(wavBlob);
    }
  }

  getLiveAudioMetrics() {
    if (!this.analyser) {
      return { rms: 0, dominantFrequency: 0, timeDomainData: new Uint8Array(0), frequencyData: new Uint8Array(0) };
    }

    const timeDomainData = new Uint8Array(this.analyser.frequencyBinCount);
    const frequencyData = new Uint8Array(this.analyser.frequencyBinCount);

    this.analyser.getByteTimeDomainData(timeDomainData);
    this.analyser.getByteFrequencyData(frequencyData);

    // Calculate RMS from timeDomainData
    let sum = 0;
    for (let i = 0; i < timeDomainData.length; i++) {
      const val = (timeDomainData[i] - 128) / 128;
      sum += val * val;
    }
    const rms = Math.sqrt(sum / timeDomainData.length);

    // Calculate dominant frequency
    let maxVal = -1;
    let maxIndex = 0;
    for (let i = 0; i < frequencyData.length; i++) {
      if (frequencyData[i] > maxVal) {
        maxVal = frequencyData[i];
        maxIndex = i;
      }
    }
    const nyquist = (this.audioContext ? this.audioContext.sampleRate : 16000) / 2;
    const dominantFrequency = Math.round(maxIndex * (nyquist / frequencyData.length));

    return {
      rms,
      dominantFrequency,
      timeDomainData,
      frequencyData
    };
  }

  /**
   * Encodes float channel buffers into standard 16-bit PCM RIFF WAV
   */
  encodeWAV(buffers, sampleRate) {
    let totalLength = 0;
    for (let i = 0; i < buffers.length; i++) {
      totalLength += buffers[i].length;
    }

    const merged = new Float32Array(totalLength);
    let offset = 0;
    for (let i = 0; i < buffers.length; i++) {
      merged.set(buffers[i], offset);
      offset += buffers[i].length;
    }

    const buffer = new ArrayBuffer(44 + merged.length * 2);
    const view = new DataView(buffer);

    // RIFF chunk descriptor
    this.writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + merged.length * 2, true);
    this.writeString(view, 8, 'WAVE');

    // FMT sub-chunk
    this.writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true); // Subchunk1Size (16 for PCM)
    view.setUint16(20, 1, true); // AudioFormat (1 = PCM)
    view.setUint16(22, 1, true); // NumChannels (1 = Mono)
    view.setUint32(24, sampleRate, true); // SampleRate
    view.setUint32(28, sampleRate * 2, true); // ByteRate (SampleRate * NumChannels * BitsPerSample/8)
    view.setUint16(32, 2, true); // BlockAlign (NumChannels * BitsPerSample/8)
    view.setUint16(34, 16, true); // BitsPerSample (16 bits)

    // Data sub-chunk
    this.writeString(view, 36, 'data');
    view.setUint32(40, merged.length * 2, true);

    // Write 16-bit PCM samples with clipping
    let pcmOffset = 44;
    for (let i = 0; i < merged.length; i++, pcmOffset += 2) {
      let s = Math.max(-1, Math.min(1, merged[i]));
      view.setInt16(pcmOffset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
    }

    return new Blob([view], { type: 'audio/wav' });
  }

  writeString(view, offset, string) {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  }
}

window.AudioProcessor = AudioProcessor;
