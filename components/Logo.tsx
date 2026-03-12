import React from 'react';

export const Logo: React.FC<{ size?: number; className?: string; hideText?: boolean }> = ({
    size = 32,
    className = '',
    hideText = false
}) => {
    return (
        <div className={`flex items-center gap-3 ${className}`}>
            <div
                className="relative flex shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-white/10 to-white/5 border border-white/20 shadow-[0_0_15px_rgba(255,255,255,0.05)]"
                style={{ width: size, height: size }}
            >
                <div className="absolute inset-0 bg-white/10 rounded-xl blur-md pointer-events-none transition-opacity duration-500 hover:opacity-100 opacity-50"></div>
                <img
                    src="/logo.png"
                    alt="RupeeWise Logo"
                    className="relative z-10 object-contain"
                    style={{ width: size * 0.7, height: size * 0.7 }}
                />
            </div>
            {/* {!hideText && (
                <span className="text-white font-extrabold tracking-tight" style={{ fontSize: size * 0.55 }}>
                    RupeeWise
                </span>
            )} */}
        </div>
    );
};
