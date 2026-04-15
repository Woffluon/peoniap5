import React, { useState, useEffect } from 'react';
import { RenderMode, SketchSettings, DEFAULT_SKETCH_SETTINGS } from '../types';

interface ControlsProps {
  effectMode: RenderMode;
  setEffectMode: (mode: RenderMode) => void;
  isMuted: boolean;
  toggleMute: () => void;
  onUploadClick: () => void;
  onCloseMenu?: () => void;
  isAudioReactive: boolean;
  toggleAudioReactivity: () => void;
  onAudioUpload: () => void;
  isRecording: boolean;
  onExportPNG: () => void;
  onToggleRecording: () => void;
  getSettings: () => SketchSettings;
  updateSketchSettings: (settings: Partial<SketchSettings>) => void;
}

const Controls: React.FC<ControlsProps> = ({
  effectMode,
  setEffectMode,
  isMuted,
  toggleMute,
  onUploadClick,
  onCloseMenu,
  isAudioReactive,
  toggleAudioReactivity,
  onAudioUpload,
  isRecording,
  onExportPNG,
  onToggleRecording,
  getSettings,
  updateSketchSettings,
}) => {
  const modes = ['ascii', 'dots', 'pixel', 'all'] as const;

  const [advOpen, setAdvOpen] = useState(false);
  const [glitchIntensity, setGlitchIntensity] = useState(DEFAULT_SKETCH_SETTINGS.glitchIntensity);
  const [rotationSpeed, setRotationSpeed] = useState(DEFAULT_SKETCH_SETTINGS.rotationSpeed);
  const [gridDensity, setGridDensity] = useState(DEFAULT_SKETCH_SETTINGS.gridDensity);
  const [bloomAmount, setBloomAmount] = useState(DEFAULT_SKETCH_SETTINGS.bloomAmount);

  useEffect(() => {
    const s = getSettings();
    if (s) {
      setGlitchIntensity(s.glitchIntensity);
      setRotationSpeed(s.rotationSpeed);
      setGridDensity(s.gridDensity);
      setBloomAmount(s.bloomAmount);
    }
  }, [getSettings]);

  const handleSlider = (key: keyof SketchSettings, value: number, setter: (v: number) => void) => {
    setter(value);
    updateSketchSettings({ [key]: value });
  };

  return (
    <>
      <div className="mode-group">
        <div className="label-small">Renderer</div>
        {modes.map((mode, index) => (
          <button
            key={mode}
            className={`text-btn ${effectMode === index ? 'active' : ''}`}
            onClick={() => { 
              setEffectMode(index as RenderMode); 
              onCloseMenu?.();
            }}
          >
            {mode}
          </button>
        ))}
      </div>

      <div className="mode-group">
        <div className="label-small">Actions</div>
        <button 
          className="text-btn" 
          onClick={onUploadClick} 
          aria-label="Upload Photo"
        >
          Photo
        </button>
        <button 
          className="text-btn" 
          onClick={onAudioUpload} 
          aria-label="Upload Music"
        >
          Music
        </button>
        <button 
          className="text-btn" 
          onClick={toggleMute} 
          aria-label={isMuted ? 'Unmute Audio' : 'Mute Audio'}
        >
          {isMuted ? 'Unmute' : 'Mute'}
        </button>
        <button 
          className={`text-btn ${isAudioReactive ? 'active' : ''}`}
          onClick={toggleAudioReactivity} 
          aria-label="Toggle Audio Reactivity"
        >
          Reactivity: {isAudioReactive ? 'ON' : 'OFF'}
        </button>
      </div>

      <div className="mode-group">
        <div className="label-small">Export</div>
        <button
          className="text-btn"
          onClick={onExportPNG}
          aria-label="Export PNG"
          style={{ pointerEvents: 'auto' }}
        >
          Export PNG
        </button>
        <button
          className={`text-btn ${isRecording ? 'recording' : ''}`}
          onClick={onToggleRecording}
          aria-label={isRecording ? 'Stop Recording' : 'Record MP4'}
          style={{ pointerEvents: 'auto' }}
        >
          {isRecording ? (
            <>
              <span className="recording-dot" />
              Recording...
            </>
          ) : (
            'Record MP4'
          )}
        </button>
      </div>

      <div className="mode-group">
        <button
          className="text-btn"
          onClick={() => setAdvOpen(!advOpen)}
          aria-label={advOpen ? 'Close Advanced' : 'Open Advanced'}
        >
          Advanced {advOpen ? '▾' : '▸'}
        </button>
      </div>

      <div className={`advanced-drawer ${advOpen ? 'open' : ''}`}>
        <div className="adv-slider-group">
          <label className="adv-label">
            Glitch Intensity
            <span className="adv-value">{glitchIntensity.toFixed(2)}</span>
          </label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={glitchIntensity}
            onChange={(e) => handleSlider('glitchIntensity', parseFloat(e.target.value), setGlitchIntensity)}
            className="adv-slider"
          />
        </div>

        <div className="adv-slider-group">
          <label className="adv-label">
            Rotation Speed
            <span className="adv-value">{rotationSpeed.toFixed(2)}</span>
          </label>
          <input
            type="range"
            min="0.1"
            max="2"
            step="0.01"
            value={rotationSpeed}
            onChange={(e) => handleSlider('rotationSpeed', parseFloat(e.target.value), setRotationSpeed)}
            className="adv-slider"
          />
        </div>

        <div className="adv-slider-group">
          <label className="adv-label">
            Grid Density
            <span className="adv-value">{Math.round(gridDensity)}</span>
          </label>
          <input
            type="range"
            min="4"
            max="20"
            step="1"
            value={gridDensity}
            onChange={(e) => handleSlider('gridDensity', parseInt(e.target.value, 10), setGridDensity)}
            className="adv-slider"
          />
        </div>

        <div className="adv-slider-group">
          <label className="adv-label">
            Bloom Amount
            <span className="adv-value">{bloomAmount.toFixed(2)}</span>
          </label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={bloomAmount}
            onChange={(e) => handleSlider('bloomAmount', parseFloat(e.target.value), setBloomAmount)}
            className="adv-slider"
          />
        </div>
      </div>
    </>
  );
};

export default Controls;
