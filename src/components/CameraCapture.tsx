import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Camera, X, Circle, StopCircle, RefreshCcw, Video } from 'lucide-react';

interface CameraCaptureProps {
  onCapture: (file: File) => void;
  onClose: () => void;
}

export default function CameraCapture({ onCapture, onClose }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [mode, setMode] = useState<'photo' | 'video'>('photo');
  const [error, setError] = useState<string | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const startCamera = useCallback(async () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    
    try {
      const constraints = {
        video: { facingMode },
        audio: mode === 'video'
      };
      
      const newStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(newStream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
      }
      setError(null);
    } catch (err: any) {
      console.error("Error accessing camera:", err);
      // Fallback: if audio fails, try video only
      if (mode === 'video' && err.name === 'NotAllowedError') {
        try {
          const videoOnlyStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode }, audio: false });
          setStream(videoOnlyStream);
          if (videoRef.current) {
            videoRef.current.srcObject = videoOnlyStream;
          }
          setError("Audio permission denied. Recording video without sound.");
        } catch (innerErr: any) {
          setError(innerErr.message || "Failed to access camera.");
        }
      } else {
        setError(err.message || "Failed to access camera and microphone.");
      }
    }
  }, [facingMode, mode]);

  useEffect(() => {
    startCamera();
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [facingMode, mode]);

  const toggleCamera = () => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  };

  const takePhoto = () => {
    if (!videoRef.current || !stream) return;
    
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    
    canvas.toBlob(blob => {
      if (blob) {
        const file = new File([blob], `capture_${Date.now()}.jpg`, { type: 'image/jpeg' });
        onCapture(file);
      }
    }, 'image/jpeg', 0.9);
  };

  const startRecording = () => {
    if (!stream) return;
    
    chunksRef.current = [];
    try {
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
      
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        const file = new File([blob], `recording_${Date.now()}.webm`, { type: 'video/webm' });
        onCapture(file);
      };
      
      mediaRecorder.start();
      mediaRecorderRef.current = mediaRecorder;
      setIsRecording(true);
      setRecordingTime(0);
      
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (err: any) {
      console.error("MediaRecorder error:", err);
      setError("Failed to start recording.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="absolute inset-0 z-[100] bg-black flex flex-col items-center justify-center">
      {/* Header */}
      <div className="absolute top-0 inset-x-0 p-4 flex justify-between items-center z-10 bg-gradient-to-b from-black/80 to-transparent">
        <button onClick={onClose} className="p-2 bg-white/20 rounded-full backdrop-blur hover:bg-white/30 transition">
          <X className="w-6 h-6 text-white" />
        </button>
        {isRecording && (
          <div className="flex items-center gap-2 bg-rose-500/80 px-3 py-1 rounded-full backdrop-blur animate-pulse">
            <div className="w-2.5 h-2.5 rounded-full bg-white"></div>
            <span className="text-white font-mono font-bold text-sm tracking-widest">{formatTime(recordingTime)}</span>
          </div>
        )}
        <button onClick={toggleCamera} disabled={isRecording} className="p-2 bg-white/20 rounded-full backdrop-blur hover:bg-white/30 transition disabled:opacity-50">
          <RefreshCcw className="w-6 h-6 text-white" />
        </button>
      </div>

      {/* Error prompt */}
      {error && (
        <div className="absolute top-20 inset-x-4 p-3 bg-red-500/90 rounded-lg backdrop-blur text-white text-sm font-medium z-10 text-center">
          {error}
        </div>
      )}

      {/* Video Preview */}
      <video 
        ref={videoRef} 
        autoPlay 
        playsInline 
        muted={mode === 'video'} // mute preview only
        className="w-full h-full object-cover" 
      />

      {/* Bottom Controls */}
      <div className="absolute bottom-0 inset-x-0 p-8 flex flex-col items-center gap-6 z-10 bg-gradient-to-t from-black/80 via-black/40 to-transparent">
        
        {/* Mode Switcher */}
        {!isRecording && (
          <div className="flex p-1 bg-white/10 rounded-full backdrop-blur-md">
            <button 
              onClick={() => setMode('photo')} 
              className={`px-4 py-1.5 rounded-full text-sm font-bold transition ${mode === 'photo' ? 'bg-white text-black' : 'text-white hover:bg-white/20'}`}
            >
              Photo
            </button>
            <button 
              onClick={() => setMode('video')} 
              className={`px-4 py-1.5 rounded-full text-sm font-bold transition flex items-center gap-1 ${mode === 'video' ? 'bg-white text-black' : 'text-white hover:bg-white/20'}`}
            >
              <Video className="w-4 h-4" /> Video
            </button>
          </div>
        )}

        {/* Capture Button */}
        <div className="flex items-center justify-center">
          {mode === 'photo' ? (
            <button 
              onClick={takePhoto}
              disabled={!stream}
              className="w-16 h-16 rounded-full border-4 border-white flex items-center justify-center hover:scale-105 active:scale-95 transition disabled:opacity-50 disabled:hover:scale-100"
            >
              <div className="w-12 h-12 bg-white rounded-full"></div>
            </button>
          ) : (
            isRecording ? (
              <button 
                onClick={stopRecording}
                className="w-16 h-16 rounded-full border-4 border-rose-500 flex items-center justify-center hover:scale-105 active:scale-95 transition"
              >
                <StopCircle className="w-12 h-12 text-rose-500 fill-rose-500" />
              </button>
            ) : (
              <button 
                onClick={startRecording}
                disabled={!stream}
                className="w-16 h-16 rounded-full border-4 border-rose-500 flex items-center justify-center hover:scale-105 active:scale-95 transition disabled:opacity-50 disabled:hover:scale-100"
              >
                <div className="w-12 h-12 bg-rose-500 rounded-full"></div>
              </button>
            )
          )}
        </div>
      </div>
    </div>
  );
}
