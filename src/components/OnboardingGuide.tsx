import React, { useState, useEffect, useLayoutEffect } from 'react';

interface OnboardingGuideProps {
    onComplete: () => void;
}

const steps = [
    {
        targetId: null,
        title: 'Bem-vindo ao Diário IA!',
        content: 'Vamos fazer um tour rápido para mostrar como você pode registrar seu dia a dia de forma inteligente. Clique em "Próximo" para começar.',
    },
    {
        targetId: 'onboarding-text-area',
        title: 'Entrada por Texto',
        content: 'Esta é a área principal de entrada. Você pode digitar qualquer nota, ideia ou lembrete aqui. A IA entenderá o contexto.',
    },
    {
        targetId: 'onboarding-mic-button',
        title: 'Entrada por Voz',
        content: 'Prefere falar? Toque no microfone para gravar suas notas. O aplicativo transcreverá sua fala e a IA fará o resto.',
    },
    {
        targetId: 'onboarding-receipt-button',
        title: 'Digitalizar Recibos',
        content: 'Anexe uma foto de um recibo aqui. A IA extrairá os detalhes como valor, fornecedor e categoria, criando uma entrada de despesa.',
    },
    {
        targetId: 'onboarding-nav-bar',
        title: 'Navegue Facilmente',
        content: 'Use a barra de navegação para alternar entre o Agente IA, a Linha do Tempo de suas entradas e a visualização em Calendário.',
    }
];

const OnboardingGuide: React.FC<OnboardingGuideProps> = ({ onComplete }) => {
    const [currentStep, setCurrentStep] = useState(0);
    const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

    const step = steps[currentStep];

    useLayoutEffect(() => {
        if (step.targetId) {
            const element = document.getElementById(step.targetId);
            if (element) {
                setTargetRect(element.getBoundingClientRect());
            }
        } else {
            setTargetRect(null); // For steps without a target
        }
    }, [currentStep, step.targetId]);


    const handleNext = () => {
        if (currentStep < steps.length - 1) {
            setCurrentStep(currentStep + 1);
        } else {
            onComplete();
        }
    };

    const handlePrev = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
        }
    };
    
    const highlightStyle: React.CSSProperties = targetRect ? {
        position: 'absolute',
        top: `${targetRect.top - 8}px`,
        left: `${targetRect.left - 8}px`,
        width: `${targetRect.width + 16}px`,
        height: `${targetRect.height + 16}px`,
        boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.7)',
        borderRadius: '8px',
        transition: 'all 0.3s ease-in-out',
        zIndex: 100,
    } : {};
    
    const tooltipStyle: React.CSSProperties = targetRect ? {
        position: 'absolute',
        top: `${targetRect.bottom + 20}px`,
        left: '50%',
        transform: 'translateX(-50%)',
        width: 'calc(100% - 40px)',
        maxWidth: '400px',
    } : {
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 'calc(100% - 40px)',
        maxWidth: '400px',
    };

    return (
        <div className="fixed inset-0 z-50">
            <div style={highlightStyle} />
            <div style={tooltipStyle} className="bg-gray-800 p-6 rounded-lg shadow-2xl border border-gray-700 z-[101]">
                <h3 className="text-xl font-bold text-blue-300 mb-2">{step.title}</h3>
                <p className="text-gray-300 mb-6">{step.content}</p>
                <div className="flex justify-between items-center">
                     <button onClick={onComplete} className="text-gray-400 hover:text-white text-sm font-semibold py-2 px-2 rounded-md transition-colors">
                        Pular
                    </button>
                    <div className="flex items-center space-x-4">
                        <span className="text-sm text-gray-500">{currentStep + 1} / {steps.length}</span>
                        <div className="flex space-x-2">
                            {currentStep > 0 && (
                                 <button onClick={handlePrev} className="bg-gray-600 hover:bg-gray-500 text-white font-semibold py-2 px-4 rounded-md transition-colors">
                                    Anterior
                                </button>
                            )}
                            <button onClick={handleNext} className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-md transition-colors">
                                {currentStep === steps.length - 1 ? 'Finalizar' : 'Próximo'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OnboardingGuide;