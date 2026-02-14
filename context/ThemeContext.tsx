import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'cosmic' | 'emerald' | 'sunset' | 'ocean' | 'midnight';

interface ThemeContextType {
    theme: Theme;
    setTheme: (theme: Theme) => void;
    themes: { id: Theme; name: string; colors: any }[];
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const themes: { id: Theme; name: string; colors: any }[] = [
    {
        id: 'cosmic',
        name: 'Cosmic (Default)',
        colors: {
            '--primary': '#6366f1', // Indigo 500
            '--primary-glow': 'rgba(99, 102, 241, 0.5)',
            '--secondary': '#06b6d4', // Cyan 500
            '--accent': '#d946ef', // Fuchsia 500
            '--bg-gradient-start': 'rgba(99, 102, 241, 0.15)',
            '--bg-gradient-end': 'rgba(217, 70, 239, 0.15)'
        }
    },
    {
        id: 'emerald',
        name: 'Emerald City',
        colors: {
            '--primary': '#10b981', // Emerald 500
            '--primary-glow': 'rgba(16, 185, 129, 0.5)',
            '--secondary': '#0ea5e9', // Sky 500
            '--accent': '#f59e0b', // Amber 500
            '--bg-gradient-start': 'rgba(16, 185, 129, 0.15)',
            '--bg-gradient-end': 'rgba(14, 165, 233, 0.15)'
        }
    },
    {
        id: 'sunset',
        name: 'Sunset Blvd',
        colors: {
            '--primary': '#f43f5e', // Rose 500
            '--primary-glow': 'rgba(244, 63, 94, 0.5)',
            '--secondary': '#f97316', // Orange 500
            '--accent': '#8b5cf6', // Violet 500
            '--bg-gradient-start': 'rgba(244, 63, 94, 0.15)',
            '--bg-gradient-end': 'rgba(249, 115, 22, 0.15)'
        }
    },
    {
        id: 'ocean',
        name: 'Deep Ocean',
        colors: {
            '--primary': '#3b82f6', // Blue 500
            '--primary-glow': 'rgba(59, 130, 246, 0.5)',
            '--secondary': '#06b6d4', // Cyan 500
            '--accent': '#14b8a6', // Teal 500
            '--bg-gradient-start': 'rgba(59, 130, 246, 0.15)',
            '--bg-gradient-end': 'rgba(6, 182, 212, 0.15)'
        }
    },
    {
        id: 'midnight',
        name: 'Midnight Pro',
        colors: {
            '--primary': '#94a3b8', // Slate 400
            '--primary-glow': 'rgba(148, 163, 184, 0.3)',
            '--secondary': '#cbd5e1', // Slate 300
            '--accent': '#ffffff', // White
            '--bg-gradient-start': 'rgba(0,0,0,0)',
            '--bg-gradient-end': 'rgba(255,255,255,0.05)'
        }
    }
];

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [theme, setThemeState] = useState<Theme>(() => {
        return (localStorage.getItem('rupeewise_theme') as Theme) || 'cosmic';
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

        // Special handling for background gradient if implemented in CSS with vars
        // In local index.css, we might need to update the radial-gradient if it's hardcoded.
        // But we can override it by setting a new background-image on body if needed,
        // or better, ensuring index.css uses these variables.

        // Let's assume index.css uses these vars or we inject styles.
        // Since index.css has hardcoded: 
        // background-image: radial-gradient(circle at 15% 50%, rgba(99, 102, 241, 0.15), transparent 25%), ...
        // We will override it directly here:

        document.body.style.backgroundImage = `
            radial-gradient(circle at 15% 50%, ${selectedTheme.colors['--bg-gradient-start']}, transparent 25%),
            radial-gradient(circle at 85% 30%, ${selectedTheme.colors['--bg-gradient-end']}, transparent 25%)
        `;

    }, [theme]);

    return (
        <ThemeContext.Provider value={{ theme, setTheme, themes }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};
