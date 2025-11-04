// Fix: Import Modality and correct EntryType import source.
import { GoogleGenAI, Type, GenerateContentResponse, LiveSession, LiveServerMessage, Modality } from '@google/genai';
import { fileToBase64 } from '../utils/helpers';
import { EntryType } from '../types';

// Assume API_KEY is set in the environment
const API_KEY = process.env.API_KEY;
if (!API_KEY) {
    console.warn("API_KEY not found in environment variables. Please set it up.");
}
const ai = new GoogleGenAI({ apiKey: API_KEY! });

const entrySchema = {
    type: Type.OBJECT,
    properties: {
        type: {
            type: Type.STRING,
            enum: [EntryType.NOTE, EntryType.EXPENSE, EntryType.EVENT],
            description: "Classifique a entrada como nota, despesa ou evento."
        },
        description: {
            type: Type.STRING,
            description: "Um resumo conciso da entrada."
        },
        date: {
            type: Type.STRING,
            description: "A data da entrada no formato AAAA-MM-DD. Se não for especificada, use a data de hoje."
        },
        amount: {
            type: Type.NUMBER,
            description: "Para despesas, o valor total. Caso contrário, nulo."
        },
        vendor: {
            type: Type.STRING,
            description: "Para despesas, o nome do fornecedor ou loja. Caso contrário, nulo."
        },
        category: {
            type: Type.STRING,
            description: "Uma categoria sugerida para a entrada (por exemplo, 'Supermercado', 'Trabalho', 'Pessoal'). Caso contrário, nulo."
        }
    },
    required: ["type", "description", "date"]
};

const processResponse = (response: GenerateContentResponse) => {
    try {
        const text = response.text.trim();
        const json = JSON.parse(text);
        
        // Garante que a data seja a de hoje se não for especificada
        const today = new Date().toISOString().split('T')[0];
        const finalDate = json.date || today;
        
        return {
            ...json,
            type: json.type.toLowerCase(),
            date: finalDate
        };
    } catch (error) {
        console.error("Error parsing Gemini response:", error);
        throw new Error("Falha ao processar a resposta da IA. Pode estar em um formato inválido.");
    }
};

export const processTextEntry = async (text: string) => {
    const prompt = `Analise o seguinte texto e converta-o em uma entrada estruturada. A data de hoje é ${new Date().toLocaleDateString('pt-BR')}. Texto: "${text}"`;
    
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: entrySchema,
        },
    });

    return processResponse(response);
};

export const processReceipt = async (imageFile: File, userNote: string) => {
    const base64Image = await fileToBase64(imageFile);
    const prompt = `Analise esta imagem de recibo e converta-a em uma entrada de despesa estruturada. Considere também a nota do usuário: "${userNote}". A data de hoje é ${new Date().toLocaleDateString('pt-BR')}.`;
    
    const imagePart = {
        inlineData: {
            mimeType: imageFile.type,
            data: base64Image,
        },
    };
    const textPart = { text: prompt };

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: [imagePart, textPart] },
        config: {
            responseMimeType: "application/json",
            responseSchema: entrySchema,
        },
    });
    
    const processed = processResponse(response);
    // Ensure it's classified as an expense
    return { ...processed, type: EntryType.EXPENSE };
};

export const startLiveSession = (callbacks: {
    onMessage: (message: LiveServerMessage) => void;
    onError: (error: Event) => void;
    onClose: (event: CloseEvent) => void;
}): Promise<LiveSession> => {
    return ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        callbacks: {
            onopen: () => console.log('Sessão ao vivo aberta.'),
            onmessage: callbacks.onMessage,
            onerror: callbacks.onError,
            onclose: callbacks.onClose,
        },
        config: {
            // A modalidade de resposta não é necessária quando usamos apenas a transcrição.
            // responseModalities: [Modality.AUDIO],
            inputAudioTranscription: {},
        }
    });
};