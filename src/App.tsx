import { useState, useRef, useEffect, useCallback, ChangeEvent, lazy, Suspense } from 'react';
const SketchCanvas = lazy(() => import('./components/SketchCanvas'));
import { SketchCanvasHandle } from './components/SketchCanvas';
import { RenderMode, AudioData, SketchSettings } from './types';
import Controls from './components/Controls';

function App() {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [effectMode, setEffectMode] = useState<RenderMode>(0);
  const [isReady, setIsReady] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [isAudioReactive, setIsAudioReactive] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [audioError, setAudioError] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isWebcamActive, setIsWebcamActive] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioFileInputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const canvasRef = useRef<SketchCanvasHandle>(null);
  const recordingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasStartedRecordingRef = useRef(false);

  // Web Audio API refs (Strict Mode safe)
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const isReactiveRef = useRef<boolean>(false);

  // Sync ref for stale closure protection
  useEffect(() => {
    isReactiveRef.current = isAudioReactive;
  }, [isAudioReactive]);

  // Phase 1: Web Audio Setup
  useEffect(() => {
    if (!audioRef.current) return;
    
    // Initialize context and nodes only once
    if (!audioContextRef.current) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContextClass();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 512;
      analyser.smoothingTimeConstant = 0.85;
      
      const source = ctx.createMediaElementSource(audioRef.current);
      source.connect(analyser);
      analyser.connect(ctx.destination);
      
      audioContextRef.current = ctx;
      analyserRef.current = analyser;
      sourceRef.current = source;
      dataArrayRef.current = new Uint8Array(analyser.frequencyBinCount);
    }
  }, []);

  const getAudioData = (): AudioData => {
    if (!isReactiveRef.current || !analyserRef.current || !dataArrayRef.current) {
      return { bass: 0, mid: 0, treble: 0 };
    }
    
    analyserRef.current.getByteFrequencyData(dataArrayRef.current as any);
    const data = dataArrayRef.current;
    
    // Bass: 0-10, Mid: 11-100, Treble: 101+
    let b = 0, m = 0, t = 0;
    for (let i = 0; i <= 10; i++) b += data[i];
    for (let i = 11; i <= 100; i++) m += data[i];
    for (let i = 101; i < data.length; i++) t += data[i];
    
    return {
      bass: (b / 11) / 255,
      mid: (m / 90) / 255,
      treble: (t / (data.length - 101)) / 255
    };
  };

  // Phase 3: Start Experience & Audio
  const startExperience = () => {
    if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }
    if (audioRef.current) {
      audioRef.current.play().catch(e => console.log("Audio play blocked", e));
      setIsMuted(false);
    }
    setHasStarted(true);
  };

  const toggleMute = () => {
    if (audioRef.current && audioContextRef.current) {
      if (audioContextRef.current.state === 'suspended') {
        audioContextRef.current.resume();
      }
      if (isMuted) {
        audioRef.current.play().catch(e => console.log("Audio play blocked", e));
        setIsMuted(false);
      } else {
        audioRef.current.pause();
        setIsMuted(true);
      }
    }
  };

  const toggleAudioReactivity = () => {
    setIsAudioReactive(!isAudioReactive);
  };

  // Clean up old URLs
  useEffect(() => {
    return () => {
      if (imageSrc) URL.revokeObjectURL(imageSrc);
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [imageSrc, audioUrl]);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // P2: File validation (Type & Size)
      if (!file.type.startsWith('image/')) {
        alert("Please upload an image file.");
        return;
      }
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        alert("File is too large. Please upload an image smaller than 5MB.");
        return;
      }

      if (imageSrc) URL.revokeObjectURL(imageSrc);
      const url = URL.createObjectURL(file);
      setImageSrc(url);
      setIsMenuOpen(false);
    }
  };

  const handleAudioUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('audio/')) {
        alert("Please upload an audio file.");
        return;
      }
      if (audioUrl) URL.revokeObjectURL(audioUrl);
      const url = URL.createObjectURL(file);
      setAudioUrl(url);
      setIsMenuOpen(false);
      setIsMuted(false);
      // Ensure context is running
      if (audioContextRef.current?.state === 'suspended') {
        audioContextRef.current.resume();
      }
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleAudioUploadClick = () => {
    audioFileInputRef.current?.click();
  };

  const handleAudioError = () => {
    setAudioError("Audio failed to load. Please check your connection.");
    setIsMuted(true);
  };

  const handleExportPNG = useCallback(() => {
    canvasRef.current?.exportCanvas();
  }, []);

  const handleToggleRecording = useCallback(() => {
    setIsRecording(prev => !prev);
  }, []);

  const handleGetSettings = useCallback((): SketchSettings => {
    return canvasRef.current?.getSettings() ?? { glitchIntensity: 0, rotationSpeed: 1, gridDensity: 4, bloomAmount: 1 };
  }, []);

  const handleUpdateSketchSettings = useCallback((settings: Partial<SketchSettings>) => {
    canvasRef.current?.updateSketchSettings(settings);
  }, []);

  // Bridge: React webcam state → p5 instance webcam control
  useEffect(() => {
    canvasRef.current?.setWebcamState(isWebcamActive);
  }, [isWebcamActive]);

  // Bridge: React isRecording state → p5 instance methods
  useEffect(() => {
    if (isRecording) {
      canvasRef.current?.startRecording();
      hasStartedRecordingRef.current = true;
      recordingTimerRef.current = setTimeout(() => setIsRecording(false), 10_000);
    } else if (hasStartedRecordingRef.current) {
      canvasRef.current?.stopRecording();
      hasStartedRecordingRef.current = false;
      if (recordingTimerRef.current) {
        clearTimeout(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
    }
  }, [isRecording]);

  // Cleanup recording timer on unmount
  useEffect(() => {
    return () => {
      if (recordingTimerRef.current) clearTimeout(recordingTimerRef.current);
    };
  }, []);

  return (
    <div className="app-container">
      <Suspense fallback={<div className="canvas-placeholder"></div>}>
        <SketchCanvas 
          ref={canvasRef}
          imageSrc={imageSrc} 
          effectMode={effectMode}
          onReady={(ready) => setIsReady(ready)}
          hasStarted={hasStarted}
          getAudioData={getAudioData}
        />
      </Suspense>

      <audio 
        ref={audioRef} 
        src={audioUrl || `${import.meta.env.BASE_URL}music.mp3`} 
        loop 
        crossOrigin="anonymous"
        onError={handleAudioError}
      />

      {audioError && (
        <div className="audio-error-toast" onClick={() => setAudioError(null)}>
          {audioError} [×]
        </div>
      )}

      {/* Start UI Overlay (Shown after loading, before art) */}
      <div className={`enter-overlay ${isReady && !hasStarted ? 'visible' : ''}`}>
        <button className="start-btn" onClick={startExperience}>
          [ ENTER ]
        </button>
      </div>

      {/* Modern UI Overlay (Main Controls) */}
      <div className={`ui-overlay ${!hasStarted ? 'hidden' : ''}`}>
        
        <div className="controls-panel-desktop">
          <Controls 
            effectMode={effectMode}
            setEffectMode={setEffectMode}
            isMuted={isMuted}
            toggleMute={toggleMute}
            onUploadClick={handleUploadClick}
            isAudioReactive={isAudioReactive}
            toggleAudioReactivity={toggleAudioReactivity}
            onAudioUpload={handleAudioUploadClick}
            isRecording={isRecording}
            onExportPNG={handleExportPNG}
            onToggleRecording={handleToggleRecording}
            getSettings={handleGetSettings}
            updateSketchSettings={handleUpdateSketchSettings}
            isWebcamActive={isWebcamActive}
            onToggleWebcam={() => setIsWebcamActive(prev => !prev)}
          />
        </div>

        <button 
          className="hamburger-btn" 
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-label={isMenuOpen ? "Close Menu" : "Open Menu"}
        >
          {isMenuOpen ? '×' : '☰'}
        </button>

        <div className={`mobile-drawer ${isMenuOpen ? 'open' : ''}`}>
          <Controls 
            effectMode={effectMode}
            setEffectMode={setEffectMode}
            isMuted={isMuted}
            toggleMute={toggleMute}
            onUploadClick={handleUploadClick}
            onCloseMenu={() => setIsMenuOpen(false)}
            isAudioReactive={isAudioReactive}
            toggleAudioReactivity={toggleAudioReactivity}
            onAudioUpload={handleAudioUploadClick}
            isRecording={isRecording}
            onExportPNG={handleExportPNG}
            onToggleRecording={handleToggleRecording}
            getSettings={handleGetSettings}
            updateSketchSettings={handleUpdateSketchSettings}
            isWebcamActive={isWebcamActive}
            onToggleWebcam={() => setIsWebcamActive(prev => !prev)}
          />
        </div>

        <input
          type="file"
          ref={fileInputRef}
          className="hidden-input"
          accept="image/*"
          onChange={handleFileChange}
        />

        <input
          type="file"
          ref={audioFileInputRef}
          className="hidden-input"
          accept="audio/*"
          onChange={handleAudioUpload}
        />
      </div>
    </div>
  );
}

export default App;
