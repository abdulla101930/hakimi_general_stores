import { useEffect, useRef, useState } from 'react';

type SpeechRecognitionLike = {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  continuous: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: ((event: unknown) => void) | null;
  onend: (() => void) | null;
};

const getSpeechRecognition = (): SpeechRecognitionLike | null => {
  const Ctor =
    (window as unknown as { SpeechRecognition?: new () => SpeechRecognitionLike }).SpeechRecognition ||
    (window as unknown as { webkitSpeechRecognition?: new () => SpeechRecognitionLike }).webkitSpeechRecognition;
  return Ctor ? new Ctor() : null;
};

export interface VoiceRecordResult {
  transcript: string;
  audioUrl: string | null;
  durationMs: number;
}

export function useVoiceRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [isSupported] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return Boolean(
      navigator.mediaDevices?.getUserMedia ||
        (window as unknown as { webkitSpeechRecognition?: unknown }).webkitSpeechRecognition ||
        (window as unknown as { SpeechRecognition?: unknown }).SpeechRecognition
    );
  });
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const transcriptRef = useRef('');
  const startTimeRef = useRef(0);
  const isRecordingRef = useRef(false);
  const sessionIdRef = useRef(0);

  useEffect(() => {
    return () => {
      stopRecording();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stopRecording = (): VoiceRecordResult | null => {
    if (!isRecordingRef.current) return null;
    const sessionId = sessionIdRef.current;
    sessionIdRef.current += 1;
    const transcript = transcriptRef.current.trim();
    const durationMs = Date.now() - startTimeRef.current;
    let audioUrl: string | null = null;

    if (chunksRef.current.length > 0) {
      const blob = new Blob(chunksRef.current, { type: mediaRecorderRef.current?.mimeType || 'audio/webm' });
      audioUrl = URL.createObjectURL(blob);
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch {
        /* noop */
      }
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.onresult = null;
        recognitionRef.current.onend = null;
        recognitionRef.current.stop();
      } catch {
        /* noop */
      }
      recognitionRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    chunksRef.current = [];
    transcriptRef.current = '';
    mediaRecorderRef.current = null;
    isRecordingRef.current = false;
    setIsRecording(false);

    void sessionId;
    return { transcript, audioUrl, durationMs };
  };

  const startRecording = async (): Promise<void> => {
    if (isRecordingRef.current || !isSupported) return;
    chunksRef.current = [];
    transcriptRef.current = '';
    isRecordingRef.current = true;
    setIsRecording(true);
    startTimeRef.current = Date.now();

    const attachRecognition = () => {
      const recognition = getSpeechRecognition();
      if (!recognition) return;
      recognitionRef.current = recognition;
      recognition.lang = 'en-IN';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;
      recognition.continuous = false;
      recognition.onresult = (event) => {
        try {
          const results = event.results;
          for (let i = 0; i < results.length; i++) {
            if (results[i] && results[i][0]) {
              transcriptRef.current = `${transcriptRef.current} ${results[i][0].transcript}`.trim();
            }
          }
        } catch {
          /* noop */
        }
      };
      recognition.onerror = () => {
        /* best-effort; audio still captured */
      };
      recognition.onend = () => {
        /* noop */
      };
      try {
        recognition.start();
      } catch {
        /* already started */
      }
    };

    attachRecognition();

    try {
      if (navigator.mediaDevices?.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamRef.current = stream;
        let mimeType = '';
        if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) mimeType = 'audio/webm;codecs=opus';
        else if (MediaRecorder.isTypeSupported('audio/webm')) mimeType = 'audio/webm';
        const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
        mediaRecorderRef.current = recorder;
        recorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
        };
        recorder.onerror = () => {
          /* best-effort */
        };
        recorder.start();
      }
    } catch {
      /* mic permission denied; speech recognition may still work */
    }
  };

  return { isRecording, isSupported, startRecording, stopRecording };
}
