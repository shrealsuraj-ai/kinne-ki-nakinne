import React, { useRef, useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Volume2, VolumeX, Maximize, Minimize, SwitchCamera, Power, Settings2, Send } from 'lucide-react';

interface ChatMessage {
  id: string;
  user: string;
  text: string;
}

export default function LiveBroadcastFeed({ isMuted, setIsMuted, isBroadcaster = false }: { isMuted: boolean, setIsMuted: (m: boolean) => void, isBroadcaster?: boolean }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { id: '1', user: 'hypebeast', text: 'Looks fire🔥' },
    { id: '2', user: 'jordan_fan', text: 'What size?' },
    { id: '3', user: 'bidder42', text: 'I need this!' },
  ]);
  const [chatInput, setChatInput] = useState('');

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    
    setChatMessages(prev => [...prev, {
      id: Date.now().toString(),
      user: isBroadcaster ? 'Host' : 'You',
      text: chatInput.trim()
    }]);
    setChatInput('');
  };

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [chatMessages]);

  useEffect(() => {
    let activeStream: MediaStream | null = null;
    let isActive = true;

    const startCamera = async () => {
      // Clean up previous stream if existing
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      
      if (!isBroadcaster) {
        // Viewers see a mock stream
        if (videoRef.current) {
          videoRef.current.src = "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4";
          const playPromise = videoRef.current.play();
          if (playPromise !== undefined) {
             playPromise.catch(e => {
               if (e.name !== 'AbortError') console.error("Mock play failed", e);
             });
          }
        }
        return;
      }
      
      try {
        const newStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode }, audio: true });
        if (!isActive) {
          newStream.getTracks().forEach(track => track.stop());
          return;
        }
        if (videoRef.current) {
          videoRef.current.srcObject = newStream;
        }
        setStream(newStream);
        activeStream = newStream;
      } catch (err: any) {
        console.error("Error accessing camera for live feed:", err);
        try {
          const videoOnlyStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode }, audio: false });
          if (!isActive) {
            videoOnlyStream.getTracks().forEach(track => track.stop());
            return;
          }
          if (videoRef.current) {
            videoRef.current.srcObject = videoOnlyStream;
          }
          setStream(videoOnlyStream);
          activeStream = videoOnlyStream;
        } catch (innerErr: any) {
           if (isActive) setError("Unable to join live broadcast feed (Camera access denied).");
        }
      }
    };
    startCamera();

    return () => {
      isActive = false;
      if (activeStream) {
        activeStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [facingMode]);

  useEffect(() => {
    if (videoRef.current) {
      if (isBroadcaster) {
         videoRef.current.muted = true; // Broadcaster shouldn't hear themselves
      } else {
         videoRef.current.muted = isMuted;
      }
    }
  }, [isMuted, isBroadcaster]);

  const toggleFullscreen = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable fullscreen:`, err);
      });
    } else {
      document.exitFullscreen();
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  return (
    <div 
      ref={containerRef}
      className={`LiveBroadcastFeed w-full h-full bg-black relative group ${isBroadcaster ? '' : ''}`}
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
      onClick={() => setShowControls(p => !p)}
    >
      {error ? (
        <div className="absolute inset-0 flex items-center justify-center flex-col p-4 text-center">
            <span className="text-rose-500 font-bold mb-2">● LIVE AUCTION</span>
            <span className="text-slate-400 text-sm">{error}</span>
        </div>
      ) : (
        <video 
          ref={videoRef}
          className={`w-full h-full object-cover transition-all duration-700 ${facingMode === 'user' ? '-scale-x-100' : ''}`} 
          autoPlay 
          playsInline
        />
      )}
      
      <div className="absolute top-4 left-4 z-10 flex gap-2 items-center pointer-events-none">
        <span className="bg-rose-600 px-2 py-1 rounded text-[10px] font-black animate-pulse text-white shadow-lg shadow-rose-600/50 flex items-center gap-1">
           <span className="w-1.5 h-1.5 bg-white rounded-full"></span> LIVE {isBroadcaster && '(You)'}
        </span>
        <span className="bg-black/50 backdrop-blur px-2 py-1 rounded text-[10px] font-bold text-white flex items-center gap-1">
           <Volume2 className="w-3 h-3" /> 1.2k Viewers
        </span>
      </div>

      {isBroadcaster && (
        <div className="absolute top-4 right-4 z-20 flex gap-2 items-center">
           <button 
             onClick={(e) => { e.stopPropagation(); }}
             className="bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1 shadow-lg pointer-events-auto transition-transform active:scale-95"
           >
             <Power className="w-4 h-4" /> End Live
           </button>
        </div>
      )}

      {/* Chat Overlay */}
      <div className="absolute bottom-20 sm:bottom-6 left-4 lg:w-80 w-[70%] h-56 flex flex-col justify-end pointer-events-none z-20">
        <div ref={chatScrollRef} className="flex-1 overflow-y-auto w-full mb-2 pr-2 pointer-events-auto flex flex-col justify-end pb-2 scrollbar-hide" style={{ WebkitMaskImage: 'linear-gradient(to top, black 50%, transparent 100%)', maskImage: 'linear-gradient(to top, black 50%, transparent 100%)' }}>
           <div className="space-y-2 mt-auto flex flex-col items-start pb-2">
             {chatMessages.map(msg => (
               <div key={msg.id} className="text-xs bg-black/40 backdrop-blur-sm rounded-lg py-1.5 px-3 max-w-full break-words border border-white/5 shadow-md">
                 <span className={`font-bold ${msg.user === 'Host' ? 'text-rose-400' : 'text-slate-300'} mr-2 shadow-black drop-shadow-md`}>{msg.user}</span>
                 <span className="text-white drop-shadow-md">{msg.text}</span>
               </div>
             ))}
           </div>
        </div>
        <form onSubmit={handleSendMessage} className="pointer-events-auto flex items-center bg-black/50 backdrop-blur-xl rounded-full border border-white/20 p-1 pl-4 h-10 shadow-lg">
          <input 
            type="text" 
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onClick={(e) => { e.stopPropagation(); setShowControls(true); }}
            placeholder="Comment..." 
            className="bg-transparent text-white outline-none flex-1 text-sm placeholder:text-white/50 w-full"
          />
          <button type="submit" className="p-2 ml-1 bg-emerald-500 rounded-full text-white hover:bg-emerald-600 transition h-full flex items-center justify-center">
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>

      <div className={`absolute bottom-6 right-4 flex flex-col gap-3 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'} z-20`}>
        {isBroadcaster && (
          <>
            <button 
              onClick={(e) => { e.stopPropagation(); setFacingMode(prev => prev === 'user' ? 'environment' : 'user'); }}
              title="Flip Camera"
              className="p-3 rounded-full bg-black/50 backdrop-blur-md text-white hover:bg-black/70 hover:scale-110 active:scale-95 transition-all outline-none border border-white/10"
            >
              <SwitchCamera className="w-5 h-5" />
            </button>
            <button 
              onClick={(e) => { e.stopPropagation();  }}
              title="Settings"
              className="p-3 rounded-full bg-black/50 backdrop-blur-md text-white hover:bg-black/70 hover:scale-110 active:scale-95 transition-all outline-none border border-white/10"
            >
              <Settings2 className="w-5 h-5" />
            </button>
          </>
        )}
        {!isBroadcaster && (
          <button 
            onClick={(e) => { e.stopPropagation(); setIsMuted(!isMuted); }}
            className="p-3 rounded-full bg-black/50 backdrop-blur-md text-white hover:bg-black/70 hover:scale-110 active:scale-95 transition-all outline-none border border-white/10"
          >
            {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </button>
        )}
        <button 
          onClick={toggleFullscreen}
          className="p-3 rounded-full bg-black/50 backdrop-blur-md text-white hover:bg-black/70 hover:scale-110 active:scale-95 transition-all outline-none border border-white/10 hidden sm:block"
        >
          {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
        </button>
      </div>
    </div>
  );
}
