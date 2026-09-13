import React from 'react';
import { X, Play, Pause, Volume2, Download, Radio, Shield } from 'lucide-react';

interface AudioPlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  audioUrl: string;
  isLiveMonitoring?: boolean;
}

export const AudioPlayerModal: React.FC<AudioPlayerModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  audioUrl,
  isLiveMonitoring = false
}) => {
  const [isPlaying, setIsPlaying] = React.useState(true);
  const [volume, setVolume] = React.useState(0.8);
  const audioRef = React.useRef<HTMLAudioElement | null>(null);

  React.useEffect(() => {
    if (isOpen) {
      setIsPlaying(true);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in zoom-in-95">
        {/* Header */}
        <div className={`px-4 py-3 flex items-center justify-between text-white ${
          isLiveMonitoring ? 'bg-gradient-to-r from-emerald-600 to-teal-700' : 'bg-gradient-to-r from-sky-600 to-indigo-700'
        }`}>
          <div className="flex items-center gap-2">
            {isLiveMonitoring ? (
              <span className="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-800/60 rounded text-[11px] font-bold text-white uppercase tracking-wider">
                <span className="w-2 h-2 rounded-full bg-emerald-300 animate-ping"></span>
                Live Audio Stream
              </span>
            ) : (
              <Volume2 className="w-4 h-4" />
            )}
            <h3 className="text-sm font-bold truncate max-w-[280px]">{title}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-white/20 rounded-full transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {subtitle && (
            <p className="text-xs text-slate-500 text-center font-medium bg-slate-50 py-1.5 px-3 rounded-md border border-slate-100">
              {subtitle}
            </p>
          )}

          {/* Sound Wave Visualization Simulation */}
          <div className="h-16 bg-slate-900 rounded-lg flex items-center justify-center gap-1 px-4 overflow-hidden shadow-inner">
            {Array.from({ length: 28 }).map((_, idx) => (
              <div
                key={idx}
                className={`w-1 rounded-full transition-all duration-300 ${
                  isLiveMonitoring ? 'bg-emerald-400' : 'bg-sky-400'
                } ${isPlaying ? 'animate-pulse' : 'opacity-30'}`}
                style={{
                  height: isPlaying ? `${Math.max(12, Math.sin(idx + Date.now() / 300) * 38 + 20)}px` : '8px',
                  animationDelay: `${idx * 40}ms`
                }}
              />
            ))}
          </div>

          <audio
            ref={audioRef}
            src={audioUrl}
            autoPlay
            loop
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
          />

          {/* Controls */}
          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-2">
              <button
                onClick={togglePlay}
                className={`w-10 h-10 rounded-full flex items-center justify-center text-white shadow-md transition cursor-pointer ${
                  isLiveMonitoring
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-sky-600 hover:bg-sky-700'
                }`}
              >
                {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
              </button>
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-slate-800">
                  {isPlaying ? (isLiveMonitoring ? 'Listening Live...' : 'Playing Recording') : 'Paused'}
                </span>
                <span className="text-[10px] text-slate-500">Codec: G.711u / Asterisk Native</span>
              </div>
            </div>

            {/* Volume control */}
            <div className="flex items-center gap-1.5 text-slate-500">
              <Volume2 className="w-4 h-4" />
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={volume}
                onChange={e => {
                  const val = parseFloat(e.target.value);
                  setVolume(val);
                  if (audioRef.current) audioRef.current.volume = val;
                }}
                className="w-20 accent-sky-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span className="text-[10px] flex items-center gap-1">
            <Shield className="w-3 h-3 text-emerald-600" />
            Supervisor Security Verified
          </span>
          <button
            onClick={onClose}
            className="px-3 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded font-medium transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
