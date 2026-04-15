import React from 'react';
import { RenderMode } from '../types';

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
  onAudioUpload
}) => {
  const modes = ['ascii', 'dots', 'pixel', 'all'] as const;

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
    </>
  );
};

export default Controls;
