import React, { useState, useEffect } from 'react';

const InstallPrompt: React.FC = () => {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [showInstallBanner, setShowInstallBanner] = useState(false);

    useEffect(() => {
        const handler = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e);
            // Only show banner if not already installed and not dismissed
            if (!localStorage.getItem('pwaInstallDismissed')) {
                setShowInstallBanner(true);
            }
        };

        window.addEventListener('beforeinstallprompt', handler);

        return () => {
            window.removeEventListener('beforeinstallprompt', handler);
        };
    }, []);

    const handleInstallClick = () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        deferredPrompt.userChoice.then((choiceResult: { outcome: string }) => {
            if (choiceResult.outcome === 'accepted') {
                console.log('User accepted the install prompt');
            } else {
                console.log('User dismissed the install prompt');
            }
            setDeferredPrompt(null);
            setShowInstallBanner(false);
        });
    };

    const handleDismiss = () => {
        localStorage.setItem('pwaInstallDismissed', 'true');
        setShowInstallBanner(false);
    };

    const isIos = () => {
        const userAgent = window.navigator.userAgent.toLowerCase();
        return /iphone|ipad|ipod/.test(userAgent);
    }
    
    const isInStandaloneMode = () => ('standalone' in window.navigator) && (window.navigator.standalone);

    // Don't show if on iOS and already in standalone mode
    if (isIos() && isInStandaloneMode()) {
        return null;
    }

    if (showInstallBanner) {
        return (
            <div className="fixed bottom-20 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-md p-4 rounded-lg shadow-lg bg-gray-800 border border-gray-700 z-50">
                <div className="flex items-center gap-4">
                    <img src="/logo.svg" alt="Diário IA Logo" className="w-12 h-12 rounded-lg" />
                    <div className="flex-grow">
                        <h3 className="font-bold text-blue-300">Instale o Diário IA</h3>
                        <p className="text-sm text-gray-300 mt-1">
                            Adicione à sua tela inicial para uma experiência mais rápida e offline.
                        </p>
                    </div>
                </div>
                <div className="flex justify-end gap-2 mt-4">
                    <button className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-md text-sm" onClick={handleDismiss}>
                        Dispensar
                    </button>
                    <button
                        className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-md text-sm"
                        onClick={handleInstallClick}
                    >
                        Instalar
                    </button>
                </div>
            </div>
        );
    }

    // Guide for iOS users
    if (isIos() && !isInStandaloneMode() && !localStorage.getItem('pwaInstallDismissed')) {
         return (
            <div className="fixed bottom-20 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-md p-4 rounded-lg shadow-lg bg-gray-800 border border-gray-700 z-50">
                <div className="flex items-center gap-4">
                    <img src="/logo.svg" alt="Diário IA Logo" className="w-12 h-12 rounded-lg" />
                    <div className="flex-grow">
                        <h3 className="font-bold text-blue-300">Instale o Diário IA</h3>
                        <p className="text-sm text-gray-300 mt-1">
                            Para instalar, toque no ícone de Compartilhar e depois em "Adicionar à Tela de Início".
                        </p>
                    </div>
                </div>
                 <div className="flex justify-end gap-2 mt-4">
                    <button className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-md text-sm" onClick={handleDismiss}>
                        Entendi
                    </button>
                </div>
            </div>
        );
    }

    return null;
};

export default InstallPrompt;