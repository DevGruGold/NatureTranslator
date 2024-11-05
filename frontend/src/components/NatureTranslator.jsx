import React, { useState, useEffect, useRef } from 'react';
import { Camera, Mic, MicOff, Video, VideoOff } from 'lucide-react';

const WS_URL = 'ws://localhost:8000/ws/audio';

const NatureTranslator = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(false);
  const [messages, setMessages] = useState([]);
  const [mediaStream, setMediaStream] = useState(null);
  const [wsConnection, setWsConnection] = useState(null);
  const audioContext = useRef(null);
  const mediaRecorder = useRef(null);

  useEffect(() => {
    if (isRecording && !wsConnection) {
      const ws = new WebSocket(WS_URL);
      
      ws.onopen = () => {
        console.log('WebSocket Connected');
        setWsConnection(ws);
      };

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        setMessages(prev => [...prev, {
          id: data.id,
          animal: data.animal,
          message: data.message,
          time: new Date().toLocaleTimeString(),
          location: data.location,
          confidence: data.confidence
        }]);
      };

      return () => {
        ws.close();
        setWsConnection(null);
      };
    }
  }, [isRecording]);

  const startAudioProcessing = async () => {
    if (!audioContext.current) {
      audioContext.current = new (window.AudioContext || window.webkitAudioContext)();
    }

    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: isVideoOn
    });

    mediaRecorder.current = new MediaRecorder(stream);

    mediaRecorder.current.ondataavailable = async (event) => {
      if (event.data.size > 0 && wsConnection?.readyState === WebSocket.OPEN) {
        const reader = new FileReader();
        reader.onloadend = () => {
          wsConnection.send(JSON.stringify({
            audio_blob: reader.result.split(',')[1],
            timestamp: Date.now(),
            location: "Local Environment"
          }));
        };
        reader.readAsDataURL(event.data);
      }
    };

    mediaRecorder.current.start(1000);
    setMediaStream(stream);
  };

  const toggleRecording = async () => {
    if (!isRecording) {
      try {
        await startAudioProcessing();
        setIsRecording(true);
      } catch (err) {
        console.error("Error accessing media devices:", err);
      }
    } else {
      if (mediaRecorder.current) {
        mediaRecorder.current.stop();
      }
      if (mediaStream) {
        mediaStream.getTracks().forEach(track => track.stop());
      }
      if (wsConnection) {
        wsConnection.close();
      }
      setMediaStream(null);
      setIsRecording(false);
      setWsConnection(null);
    }
  };

  const toggleVideo = async () => {
    setIsVideoOn(!isVideoOn);
    if (isRecording) {
      await toggleRecording();
      setTimeout(toggleRecording, 100);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4 bg-gray-50 min-h-screen">
      <div className="bg-white rounded-lg shadow-lg p-4 mb-4">
        <h1 className="text-2xl font-bold mb-4">Nature Conversation Translator</h1>
        
        <div className="flex gap-4 mb-4">
          <button
            onClick={toggleRecording}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
              isRecording ? 'bg-red-500 text-white' : 'bg-blue-500 text-white'
            }`}
          >
            {isRecording ? <MicOff /> : <Mic />}
            {isRecording ? 'Stop Recording' : 'Start Recording'}
          </button>
          
          <button
            onClick={toggleVideo}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
              isVideoOn ? 'bg-green-500 text-white' : 'bg-gray-500 text-white'
            }`}
          >
            {isVideoOn ? <VideoOff /> : <Video />}
            {isVideoOn ? 'Disable Camera' : 'Enable Camera'}
          </button>
        </div>

        {isVideoOn && mediaStream && (
          <div className="mb-4">
            <video
              autoPlay
              ref={video => {
                if (video) {
                  video.srcObject = mediaStream;
                }
              }}
              className="w-full rounded-lg"
            />
          </div>
        )}

        <div className="space-y-4 max-h-96 overflow-y-auto">
          {messages.map(({ id, animal, message, time, location, confidence }) => (
            <div key={id} className="bg-gray-100 rounded-lg p-4">
              <div className="flex justify-between text-sm text-gray-600 mb-1">
                <span className="font-semibold">{animal}</span>
                <span>{time} - {location}</span>
              </div>
              <p className="text-gray-800">{message}</p>
              <div className="text-xs text-gray-500 mt-1">
                Confidence: {(confidence * 100).toFixed(1)}%
              </div>
            </div>
          ))}
        </div>

        {messages.length === 0 && !isRecording && (
          <div className="text-center text-gray-500 py-8">
            Press "Start Recording" to begin translating nature's conversations!
          </div>
        )}
      </div>
    </div>
  );
};

export default NatureTranslator;
