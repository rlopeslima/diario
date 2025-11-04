import React, { useState, useRef, useEffect, useCallback } from 'react';
import { LiveSession, Blob } from '@google/genai';
import { Entry } from '../types';
import { MicIcon, PaperclipIcon, HomeIcon, SendIcon } from '../components/icons';
import LoadingSpinner from '../components/LoadingSpinner';
import { processTextEntry, processReceipt, startLiveSession } from '../services/geminiService';
import { encode } from '../utils/helpers';

interface HomeViewProps {
    addEntry: (entry: Omit<Entry, 'id' | 'user_id' | 'date'> & { date: string }) => void;
}

const HomeView: React.FC<HomeViewProps> = ({ addEntry }) => {
    const [isRecording, setIsRecording] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [text, setText] = useState('');
    const [status, setStatus] = useState('Digite, fale ou anexe um recibo.');
    const [error, setError] = useState<string | null>(null);

    const sessionRef = useRef<LiveSession | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const cleanupAudio = useCallback(() => {
        streamRef.current?.getTracks().forEach(track => track.stop());
        audioContextRef.current?.close().catch(console.error);
        sessionRef.current?.close();
        streamRef.current = null;
        audioContextRef.current = null;
        sessionRef.current = null;
    }, []);

    const processAndReset = async (processor: Promise<any>) => {
        setError(null);
        setIsProcessing(true);
        try {
            const newEntry = await processor;
            addEntry(newEntry);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Ocorreu um erro desconhecido.');
        } finally {
            setIsProcessing(false);
            setText('');
            setStatus('Digite, fale ou anexe um recibo.');
        }
    };

    const handleProcessText = () => {
        if (!text.trim()) return;
        setStatus('Processando sua nota...');
        processAndReset(processTextEntry(text));
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
        setStatus('Analisando o recibo...');
        processAndReset(processReceipt(file, text));
        if(fileInputRef.current) fileInputRef.current.value = '';
    };

    const toggleRecording = async () => {
        if (isRecording) {
            setIsRecording(false);
            cleanupAudio();
            if (text.trim()) {
                handleProcessText();
            }
        } else {
            setError(null);
            setText('');
            setIsRecording(true);
            setStatus('Ouvindo...');
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                streamRef.current = stream;
                const context = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
                audioContextRef.current = context;
                
                const session = await startLiveSession({
                    onMessage: (msg) => {
                        if (msg.serverContent?.inputTranscription) {
                            setText(prev => prev + msg.serverContent.inputTranscription.text);
                        }
                    },
                    onError: (e) => { setError("Erro de conexão."); console.error(e); setIsRecording(false); },
                    onClose: () => {},
                });
                sessionRef.current = session;

                const source = context.createMediaStreamSource(stream);
                const processor = context.createScriptProcessor(4096, 1, 1);
                
                processor.onaudioprocess = (e) => {
                    const inputData = e.inputBuffer.getChannelData(0);
                    const int16 = new Int16Array(inputData.length);
                    for (let i = 0; i < inputData.length; i++) {
                        int16[i] = inputData[i] * 32768;
                    }
                    const pcmBlob: Blob = { data: encode(new Uint8Array(int16.buffer)), mimeType: 'audio/pcm;rate=16000' };
                    session.sendRealtimeInput({ media: pcmBlob });
                };

                source.connect(processor);
                processor.connect(context.destination);

            } catch (err) {
                setError("Não foi possível acessar o microfone.");
                setIsRecording(false);
                cleanupAudio();
            }
        }
    };

    useEffect(() => cleanupAudio, [cleanupAudio]);

    return (
        <div className="flex flex-col h-full items-center justify-center p-4 text-center">
            <div className="w-20 h-20 text-blue-400 mb-4"><HomeIcon /></div>
            <h1 className="text-4xl font-bold mb-2">Diário IA</h1>
            <p className="text-gray-400 mb-8 max-w-sm h-6">
                {isProcessing ? <span className="flex items-center justify-center"><LoadingSpinner size={4} /><span className="ml-2">{status}</span></span> : status}
            </p>

            <textarea
                id="onboarding-text-area"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Sua anotação aqui..."
                className="bg-gray-800 rounded-lg p-4 w-full max-w-md min-h-[120px] shadow-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isRecording || isProcessing}
            />

            {error && <p className="text-red-400 mt-4">{error}</p>}
            
            <div className="flex items-center space-x-4 mt-8">
                <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" disabled={isProcessing || isRecording} />
                <button id="onboarding-receipt-button" onClick={() => fileInputRef.current?.click()} disabled={isProcessing || isRecording} className="p-4 rounded-full bg-gray-600 hover:bg-gray-500 disabled:opacity-50">
                    <PaperclipIcon />
                </button>
                <button id="onboarding-mic-button" onClick={toggleRecording} disabled={isProcessing} className={`p-8 rounded-full transition-all ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-blue-500 hover:bg-blue-400'}`}>
                    <MicIcon />
                </button>
                <button onClick={handleProcessText} disabled={isProcessing || isRecording || !text.trim()} className="p-4 rounded-full bg-gray-600 hover:bg-gray-500 disabled:opacity-50">
                    <SendIcon />
                </button>
            </div>
        </div>
    );
};

export default HomeView;