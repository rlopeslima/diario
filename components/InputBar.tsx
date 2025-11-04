import React, { useState, useRef, useEffect, useCallback } from 'react';
import { LiveSession, Blob, LiveServerMessage } from '@google/genai';
import { Entry } from '../types';
import { MicIcon, PaperclipIcon, SendIcon } from './icons';
import LoadingSpinner from './LoadingSpinner';
import { processTextEntry, processReceipt, startLiveSession } from '../services/geminiService';
import { encode } from '../utils/helpers';

interface InputBarProps {
    addEntry: (entry: Omit<Entry, 'id' | 'date'> & { date: string }) => void;
}

const InputBar: React.FC<InputBarProps> = ({ addEntry }) => {
    const [isRecording, setIsRecording] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [status, setStatus] = useState('Digite uma nota, fale comigo ou anexe um recibo.');
    const [error, setError] = useState<string | null>(null);

    const sessionPromiseRef = useRef<Promise<LiveSession> | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const processorRef = useRef<ScriptProcessorNode | null>(null);
    const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const cleanupAudio = useCallback(() => {
        processorRef.current?.disconnect();
        sourceRef.current?.disconnect();
        streamRef.current?.getTracks().forEach(track => track.stop());
        audioContextRef.current?.close();
        processorRef.current = null;
        sourceRef.current = null;
        streamRef.current = null;
        audioContextRef.current = null;
    }, []);

    const handleProcessText = useCallback(async (text: string) => {
        if (!text.trim()) return;
        setError(null);
        setIsProcessing(true);
        setStatus('Processando sua nota...');
        try {
            const newEntry = await processTextEntry(text);
            addEntry(newEntry);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Ocorreu um erro desconhecido.');
        } finally {
            setIsProcessing(false);
            setTranscript('');
            setStatus('Digite uma nota, fale comigo ou anexe um recibo.');
        }
    }, [addEntry]);

    const stopRecording = useCallback(async () => {
        if (!isRecording) return;
        setIsRecording(false);
        setStatus('Gravação concluída. Revise e envie.');
        const session = await sessionPromiseRef.current;
        session?.close();
        cleanupAudio();
    }, [isRecording, cleanupAudio]);

    const startRecording = async () => {
        if (isRecording) {
            await stopRecording();
            return;
        }
        setError(null);
        setTranscript('');
        setIsRecording(true);
        setStatus('Ouvindo...');
        try {
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
            streamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
            sessionPromiseRef.current = startLiveSession({
                onMessage: (message: LiveServerMessage) => {
                    if (message.serverContent?.inputTranscription) {
                        setTranscript(prev => prev + message.serverContent.inputTranscription.text);
                    }
                },
                onError: (e) => {
                    console.error("Live session error:", e);
                    setError("Ocorreu um erro de conexão.");
                    setIsRecording(false);
                },
                onClose: () => console.log('Sessão ao vivo fechada.'),
            });
            sourceRef.current = audioContextRef.current.createMediaStreamSource(streamRef.current);
            processorRef.current = audioContextRef.current.createScriptProcessor(4096, 1, 1);
            processorRef.current.onaudioprocess = (audioProcessingEvent) => {
                const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
                const int16 = new Int16Array(inputData.length);
                for (let i = 0; i < inputData.length; i++) {
                    int16[i] = inputData[i] * 32768;
                }
                const pcmBlob: Blob = { data: encode(new Uint8Array(int16.buffer)), mimeType: 'audio/pcm;rate=16000' };
                sessionPromiseRef.current?.then((session) => session.sendRealtimeInput({ media: pcmBlob }));
            };
            sourceRef.current.connect(processorRef.current);
            processorRef.current.connect(audioContextRef.current.destination);
        } catch (err) {
            console.error("Error starting recording:", err);
            setError("Não foi possível acessar o microfone. Por favor, verifique as permissões.");
            setIsRecording(false);
            cleanupAudio();
        }
    };

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
        setError(null);
        setIsProcessing(true);
        setStatus('Analisando o recibo...');
        try {
            const newEntry = await processReceipt(file, transcript);
            addEntry(newEntry);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Falha ao processar o recibo.');
        } finally {
            setIsProcessing(false);
            setTranscript('');
            if (fileInputRef.current) fileInputRef.current.value = '';
            setStatus('Digite uma nota, fale comigo ou anexe um recibo.');
        }
    };

    useEffect(() => {
        return () => {
            sessionPromiseRef.current?.then(session => session.close());
            cleanupAudio();
        };
    }, [cleanupAudio]);

    return (
        <div className="fixed bottom-16 left-0 right-0 bg-gray-900/80 backdrop-blur-sm border-t border-gray-700 p-2 z-20">
            {error && <p className="text-red-400 text-xs text-center pb-1">{error}</p>}
            <div className="flex items-end max-w-md mx-auto">
                <textarea
                    value={transcript}
                    onChange={(e) => setTranscript(e.target.value)}
                    placeholder={isRecording ? "Ouvindo..." : "Digite sua nota..."}
                    className="bg-gray-800 rounded-lg p-2 w-full max-w-md shadow-inner border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-200 resize-none transition-shadow text-sm max-h-24"
                    rows={1}
                    disabled={isProcessing || isRecording}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleProcessText(transcript);
                        }
                    }}
                />
                <div className="flex items-center ml-2">
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" disabled={isProcessing || isRecording} />
                    {!transcript.trim() && !isRecording && (
                        <button onClick={() => fileInputRef.current?.click()} disabled={isProcessing || isRecording} className="p-2 text-gray-400 hover:text-blue-300 transition-colors" title="Anexar Recibo">
                            <PaperclipIcon />
                        </button>
                    )}
                    {transcript.trim() ? (
                        <button onClick={() => handleProcessText(transcript)} disabled={isProcessing || isRecording} className="p-2 bg-blue-500 text-white rounded-full" title="Enviar Texto">
                            <SendIcon />
                        </button>
                    ) : (
                        <button onClick={startRecording} disabled={isProcessing} className={`p-2 rounded-full transition-colors ${isRecording ? 'bg-red-500 text-white animate-pulse' : 'text-gray-400 hover:text-blue-300'}`} title={isRecording ? 'Parar Gravação' : 'Gravar Voz'}>
                            <MicIcon />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default InputBar;