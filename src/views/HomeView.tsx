import React, { useState, useRef, useEffect, useCallback } from 'react';
import { LiveSession, Blob, LiveServerMessage } from '@google/genai';
import { Entry } from '../types';
// Fix: Import HomeIcon to resolve reference error.
import { MicIcon, PaperclipIcon, HomeIcon, SendIcon } from '../components/icons';
import LoadingSpinner from '../components/LoadingSpinner';
import { processTextEntry, processReceipt, startLiveSession } from '../services/geminiService';
// Fix: Use local encode helper instead of external library, per guidelines.
import { encode } from '../utils/helpers';


interface HomeViewProps {
    // Fix: Update type to match the implementation in App.tsx.
    addEntry: (entry: Omit<Entry, 'id' | 'date'> & { date: string }) => void;
}

const HomeView: React.FC<HomeViewProps> = ({ addEntry }) => {
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
        
        const session = await sessionPromiseRef.current;
        session?.close();
        cleanupAudio();
        
        handleProcessText(transcript);

    }, [isRecording, transcript, cleanupAudio, handleProcessText]);

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
                onClose: () => {
                     console.log('Sessão ao vivo fechada.');
                },
            });

            sourceRef.current = audioContextRef.current.createMediaStreamSource(streamRef.current);
            processorRef.current = audioContextRef.current.createScriptProcessor(4096, 1, 1);
            
            processorRef.current.onaudioprocess = (audioProcessingEvent) => {
                const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
                const l = inputData.length;
                const int16 = new Int16Array(l);
                for (let i = 0; i < l; i++) {
                    int16[i] = inputData[i] * 32768;
                }
                const pcmBlob: Blob = {
                    data: encode(new Uint8Array(int16.buffer)),
                    mimeType: 'audio/pcm;rate=16000',
                };
                sessionPromiseRef.current?.then((session) => {
                    session.sendRealtimeInput({ media: pcmBlob });
                });
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
            // The current `transcript` text is used as an additional note for the receipt
            const newEntry = await processReceipt(file, transcript);
            addEntry(newEntry);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Falha ao processar o recibo.');
        } finally {
            setIsProcessing(false);
            setTranscript('');
            if(fileInputRef.current) fileInputRef.current.value = '';
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
        <div className="flex flex-col h-full items-center justify-center p-4 text-center">
            <div className="w-20 h-20 text-blue-400 mb-4">
                <HomeIcon />
            </div>
            <h1 className="text-4xl font-bold mb-2">Diário IA</h1>
            <p className="text-gray-400 mb-8 max-w-sm">
                {isProcessing ? <span className="flex items-center justify-center"><LoadingSpinner size={4} /> <span className="ml-2">{status}</span></span> : status}
            </p>

            <textarea
                id="onboarding-text-area"
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                placeholder="Digite sua anotação ou use o microfone..."
                className="bg-gray-800 rounded-lg p-4 w-full max-w-md min-h-[120px] shadow-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-200 resize-none transition-shadow"
                disabled={isRecording || isProcessing}
                aria-label="Caixa de texto para anotações"
            />

            {error && <p className="text-red-400 mt-4">{error}</p>}
            
            <div className="flex items-center space-x-4 mt-8">
                 <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*"
                    className="hidden"
                    disabled={isProcessing || isRecording}
                />
                <button
                    id="onboarding-receipt-button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isProcessing || isRecording}
                    className="p-4 rounded-full bg-gray-600 hover:bg-gray-500 transition-colors disabled:opacity-50"
                    aria-label="Anexar recibo"
                >
                    <PaperclipIcon />
                </button>
                <button
                    id="onboarding-mic-button"
                    onClick={startRecording}
                    disabled={isProcessing}
                    className={`p-8 rounded-full transition-all duration-300 ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-blue-500 hover:bg-blue-400'}`}
                    aria-label={isRecording ? 'Parar gravação' : 'Iniciar gravação'}
                >
                    <MicIcon />
                </button>
                <button
                    onClick={() => handleProcessText(transcript)}
                    disabled={isProcessing || isRecording || !transcript.trim()}
                    className="p-4 rounded-full bg-gray-600 hover:bg-gray-500 transition-colors disabled:opacity-50"
                    aria-label="Enviar texto"
                >
                    <SendIcon />
                </button>
            </div>

        </div>
    );
};

export default HomeView;