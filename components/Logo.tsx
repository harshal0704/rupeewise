import React from 'react';

export const Logo: React.FC<{ size?: number; className?: string; hideText?: boolean }> = ({
    size = 32,
    className = '',
    hideText = false
}) => {
    return (
        <div className={`flex items-center gap-3 ${className}`}>
            <img
                src="/logo.png"
                alt="RupeeWise Logo"
                className="relative z-10 object-contain drop-shadow-lg"
                style={{ width: size, height: size }}
            />
            {/* {!hideText && (
                <span className="text-white font-extrabold tracking-tight" style={{ fontSize: size * 0.55 }}>
                    RupeeWise
                </span>
            )} */}
        </div>
    );
};
