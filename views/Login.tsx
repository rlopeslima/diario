import React from 'react';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '../src/integrations/supabase/client';

const Login: React.FC = () => {
    return (
        <div className="flex justify-center items-center h-screen bg-gray-900">
            <div className="w-full max-w-md p-8 space-y-8 bg-gray-800 rounded-lg shadow-lg mx-4">
                <div className="text-center">
                    <h1 className="text-3xl font-bold text-blue-300">Diário IA</h1>
                    <p className="mt-2 text-gray-400">Faça login para continuar</p>
                </div>
                <Auth
                    supabaseClient={supabase}
                    appearance={{ 
                        theme: ThemeSupa,
                        style: {
                            button: { background: '#3b82f6', color: 'white', borderColor: '#3b82f6' },
                            anchor: { color: '#60a5fa' },
                            input: { backgroundColor: '#1f2937', color: 'white', borderColor: '#4b5563' },
                            label: { color: '#d1d5db' },
                            message: { color: '#f87171' },
                        }
                    }}
                    providers={[]}
                    theme="dark"
                />
            </div>
        </div>
    );
};

export default Login;