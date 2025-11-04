import React from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';

function ReloadPrompt() {
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log('Service Worker registered:', r);
    },
    onRegisterError(error) {
      console.log('Service Worker registration error:', error);
    },
  });

  const close = () => {
    setOfflineReady(false);
    setNeedRefresh(false);
  };

  if (offlineReady || needRefresh) {
    return (
      <div className="fixed right-0 bottom-0 m-4 p-4 rounded-lg shadow-lg bg-gray-800 border border-gray-700 z-50">
        <div className="flex items-start gap-4">
          <div className="flex-grow">
            {needRefresh ? (
              <h3 className="font-bold text-blue-300">Nova versão disponível!</h3>
            ) : (
              <h3 className="font-bold text-green-400">App pronto para uso offline.</h3>
            )}
            <p className="text-sm text-gray-300 mt-1">
              {needRefresh ? 'Clique no botão para recarregar e aplicar a atualização.' : 'O aplicativo foi salvo em cache para funcionar sem internet.'}
            </p>
          </div>
          <div className="flex flex-col gap-2 items-center">
            {needRefresh && (
              <button
                className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-md text-sm"
                onClick={() => updateServiceWorker(true)}
              >
                Recarregar
              </button>
            )}
            <button className="w-full bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-md text-sm" onClick={close}>
              Fechar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

export default ReloadPrompt;