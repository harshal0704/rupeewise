import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'obsidian' | 'midnight' | 'aurora' | 'porcelain';

export interface ThemeConfig {
    id: Theme;
    name: string;
    isLight?: boolean;
    colors: Record<string, string>;
}

interface ThemeContextType {
    theme: Theme;
    setTheme: (theme: Theme) => void;
    themes: ThemeConfig[];
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const themes: ThemeConfig[] = [
    {
        id: 'obsidian',
        name: 'Obsidian',
        colors: {
            '--surface-0': '#08090a',
            '--surface-1': '#0f1012',
            '--surface-2': '#161719',
            '--surface-3': '#1e1f22',
            '--surface-4': '#26272b',
            '--primary': '#d4a853',
            '--primary-glow': 'rgba(212, 168, 83, 0.25)',
            '--primary-soft': 'rgba(212, 168, 83, 0.08)',
            '--secondary': '#34d399',
            '--accent': '#f0dca0',
            '--text-main': '#f5f5f5',
            '--text-secondary': '#a1a1aa',
            '--text-muted': '#71717a',
            '--text-dim': '#3f3f46',
            '--glass-bg': 'rgba(14, 15, 17, 0.85)'
        }
    },
    {
        id: 'midnight',
        name: 'Midnight',
        colors: {
            '--surface-0': '#030712',
            '--surface-1': '#080d1e',
            '--surface-2': '#121a2f',
            '--surface-3': '#1e293b',
            '--surface-4': '#334155',
            '--primary': '#38bdf8',
            '--primary-glow': 'rgba(56, 189, 248, 0.25)',
            '--primary-soft': 'rgba(56, 189, 248, 0.08)',
            '--secondary': '#a78bfa',
            '--accent': '#e0f2fe',
            '--text-main': '#f8fafc',
            '--text-secondary': '#94a3b8',
            '--text-muted': '#64748b',
            '--text-dim': '#475569',
            '--glass-bg': 'rgba(3, 7, 18, 0.85)'
        }
    },
    {
        id: 'aurora',
        name: 'Aurora',
        colors: {
            '--surface-0': '#020617',
            '--surface-1': '#021008',
            '--surface-2': '#052e16',
            '--surface-3': '#064e3b',
            '--surface-4': '#065f46',
            '--primary': '#10b981',
            '--primary-glow': 'rgba(16, 185, 129, 0.25)',
            '--primary-soft': 'rgba(16, 185, 129, 0.08)',
            '--secondary': '#0ea5e9',
            '--accent': '#a7f3d0',
            '--text-main': '#f8fafc',
            '--text-secondary': '#6ee7b7',
            '--text-muted': '#34d399',
            '--text-dim': '#059669',
            '--glass-bg': 'rgba(2, 16, 8, 0.85)'
        }
    },
    {
        id: 'porcelain',
        name: 'Porcelain',
        isLight: true,
        colors: {
            '--surface-0': '#f8fafc',
            '--surface-1': '#ffffff',
            '--surface-2': '#f1f5f9',
            '--surface-3': '#e2e8f0',
            '--surface-4': '#cbd5e1',
            '--primary': '#2563eb',
            '--primary-glow': 'rgba(37, 99, 235, 0.15)',
            '--primary-soft': 'rgba(37, 99, 235, 0.08)',
            '--secondary': '#8b5cf6',
            '--accent': '#1e40af',
            '--text-main': '#0f172a',
            '--text-secondary': '#475569',
            '--text-muted': '#64748b',
            '--text-dim': '#94a3b8',
            '--glass-bg': 'rgba(255, 255, 255, 0.85)'
        }
    }
];

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [theme, setThemeState] = useState<Theme>(() => {
        const stored = localStorage.getItem('rupeewise_theme');
        // Migrate old themes to 'obsidian'
        if (!themes.find(t => t.id === stored)) return 'obsidian';
        return stored as Theme;
    });

    const setTheme = (newTheme: Theme) => {
        setThemeState(newTheme);
        localStorage.setItem('rupeewise_theme', newTheme);
    };

    useEffect(() => {
        const selectedTheme = themes.find(t => t.id === theme) || themes[0];

        // Apply CSS variables
        Object.entries(selectedTheme.colors).forEach(([key, value]) => {
            document.documentElement.style.setProperty(key, value as string);
        });

        // Add a class to body for global light/dark overrides if needed
        if (selectedTheme.isLight) {
            document.body.classList.add('light-theme');
        } else {
            document.body.classList.remove('light-theme');
        }

        // Update glass border to match theme
        const primaryColor = selectedTheme.colors['--primary'];
        document.documentElement.style.setProperty('--glass-border', `rgba(${hexToRgb(primaryColor)}, 0.15)`);
        document.documentElement.style.setProperty('--glass-border-hover', `rgba(${hexToRgb(primaryColor)}, 0.3)`);
        document.documentElement.style.setProperty('--glass-highlight', `rgba(${hexToRgb(primaryColor)}, 0.05)`);

    }, [theme]);

    return (
        <ThemeContext.Provider value={{ theme, setTheme, themes }}>
            {children}
        </ThemeContext.Provider>
    );
};

// Helper to convert hex to rgb string
const hexToRgb = (hex: string): string => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return '212, 168, 83';
    return `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`;
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};
