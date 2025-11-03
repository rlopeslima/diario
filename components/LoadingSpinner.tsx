
import React from 'react';

const LoadingSpinner: React.FC<{ size?: number }> = ({ size = 8 }) => {
    return (
        <div className={`w-${size} h-${size} border-4 border-gray-500 border-t-blue-400 rounded-full animate-spin`}></div>
    );
};

export default LoadingSpinner;
