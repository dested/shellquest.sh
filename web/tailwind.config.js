import {fontFamily} from 'tailwindcss/defaultTheme';
import defaultTheme from 'tailwindcss/defaultTheme';

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{ts,tsx,js,jsx}'],
  theme: {
    container: {
      center: 'true',
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      fontFamily: {
        gabarito: ['Gabarito', ...defaultTheme.fontFamily.sans],
        ivar: ['Ivar Headline', ...defaultTheme.fontFamily.serif],
        sans: ['DM Sans', ...fontFamily.sans],
      },
      fontSize: {
        'heading-1': [
          '3rem',
          {
            lineHeight: '1.2',
            fontWeight: '600',
          },
        ],
        'heading-2': [
          '2.5rem',
          {
            lineHeight: '1.3',
            fontWeight: '500',
          },
        ],
        'heading-3': [
          '2rem',
          {
            lineHeight: '1.4',
            fontWeight: '500',
          },
        ],
        body: [
          '1rem',
          {
            lineHeight: '1.5',
            fontWeight: '400',
          },
        ],
        caption: [
          '0.875rem',
          {
            lineHeight: '1.4',
            fontWeight: '400',
          },
        ],
      },
      animation: {
        gradient: 'gradient 8s linear infinite',
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'pulse-subtle': 'pulse-subtle 3s ease-in-out infinite',
        'float-slow': 'float-slow 6s ease-in-out infinite',
        'spin-slow': 'spin 8s linear infinite',
        float: 'float 15s ease-in-out infinite',
      },
      keyframes: {
        gradient: {
          '0%, 100%': {
            'background-position': '0% 50%',
          },
          '50%': {
            'background-position': '100% 50%',
          },
        },
        'pulse-subtle': {
          '0%, 100%': {
            transform: 'scale(1)',
            opacity: '1',
          },
          '50%': {
            transform: 'scale(0.97)',
            opacity: '0.9',
          },
        },
        'float-slow': {
          '0%, 100%': {
            transform: 'translateY(0) rotate(0deg)',
          },
          '50%': {
            transform: 'translateY(-5px) rotate(1deg)',
          },
        },
        float: {
          '0%, 100%': {
            transform: 'translateY(0) translateX(0)',
          },
          '25%': {
            transform: 'translateY(-15px) translateX(10px)',
          },
          '50%': {
            transform: 'translateY(-25px) translateX(15px)',
          },
          '75%': {
            transform: 'translateY(-15px) translateX(10px)',
          },
        },
        'accordion-down': {
          from: {
            height: '0',
          },
          to: {
            height: 'var(--radix-accordion-content-height)',
          },
        },
        'accordion-up': {
          from: {
            height: 'var(--radix-accordion-content-height)',
          },
          to: {
            height: '0',
          },
        },
      },
      colors: {
        // Brand colors with more personality
        brand: {
          50: "oklch(97.49% 0.013 35.83 / <alpha-value>)",
          100: "oklch(95.11% 0.024 40.39 / <alpha-value>)",
          200: "oklch(91.03% 0.047 42.73 / <alpha-value>)",
          300: "oklch(86.09% 0.076 44.05 / <alpha-value>)",
          400: "oklch(82.02% 0.105 46.79 / <alpha-value>)",
          500: "oklch(77.13% 0.145 50.83 / <alpha-value>)",
          600: "oklch(72.53% 0.17 55 / <alpha-value>)",
          700: "oklch(57.96% 0.137 54.7 / <alpha-value>)",
          800: "oklch(43.05% 0.101 55.02 / <alpha-value>)",
          900: "oklch(28.87% 0.068 54.56 / <alpha-value>)",
          950: "oklch(21% 0.049 55.21 / <alpha-value>)"
        },
        
        // Modern accent colors
        accents: {
          blue: {
            light: '#60A5FA', // Sky blue
            DEFAULT: '#3B82F6', // Bright blue
            dark: '#1E40AF', // Deep blue
          },
          emerald: {
            light: '#34D399',
            DEFAULT: '#10B981',
            dark: '#059669',
          },
          purple: {
            light: '#A78BFA',
            DEFAULT: '#8B5CF6',
            dark: '#6D28D9',
          },
          rose: {
            light: '#FB7185',
            DEFAULT: '#F43F5E',
            dark: '#E11D48',
          },
          amber: {
            light: '#FCD34D',
            DEFAULT: '#F59E0B',
            dark: '#D97706',
          },
        },

        // Neutral colors with subtle warmth
        neutral: {
          50: '#FAFAF9',
          100: '#F5F5F4',
          200: '#E7E5E4',
          300: '#D6D3D1',
          400: '#A8A29E',
          500: '#78716C',
          600: '#57534E',
          700: '#44403C',
          800: '#292524',
          900: '#1C1917',
          950: '#0C0A09',
        },

        // Status colors
        success: {
          light: '#86EFAC',
          DEFAULT: '#22C55E',
          dark: '#16A34A',
        },
        warning: {
          light: '#FDE047',
          DEFAULT: '#EAB308',
          dark: '#CA8A04',
        },
        error: {
          light: '#FCA5A5',
          DEFAULT: '#EF4444',
          dark: '#DC2626',
        },
        info: {
          light: '#93C5FD',
          DEFAULT: '#3B82F6',
          dark: '#2563EB',
        },

        surface: {
          DEFAULT: '#ffffff',
          dark: '#1A1A1A',
          card: 'rgba(255, 255, 255, 0.08)',
        },
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        chart: {
          1: 'hsl(var(--chart-1))',
          2: 'hsl(var(--chart-2))',
          3: 'hsl(var(--chart-3))',
          4: 'hsl(var(--chart-4))',
          5: 'hsl(var(--chart-5))',
        },
        sidebar: {
          DEFAULT: 'hsl(var(--sidebar-background))',
          foreground: 'hsl(var(--sidebar-foreground))',
          primary: 'hsl(var(--sidebar-primary))',
          'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
          accent: 'hsl(var(--sidebar-accent))',
          'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
          border: 'hsl(var(--sidebar-border))',
          ring: 'hsl(var(--sidebar-ring))',
        },
      },
      boxShadow: {
        'sm': '0 1px 2px 0 rgb(0 0 0 / 0.05)',
        'DEFAULT': '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
        'md': '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
        'lg': '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
        'xl': '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
        '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
        'inner': 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
        'glow': '0 0 20px rgba(255, 199, 0, 0.3)',
        'glow-sm': '0 0 10px rgba(255, 199, 0, 0.2)',
        'glow-lg': '0 0 30px rgba(255, 199, 0, 0.4)',
        'card': '0 2px 8px -2px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.06)',
        'card-hover': '0 10px 20px -5px rgba(0, 0, 0, 0.1), 0 4px 8px -4px rgba(0, 0, 0, 0.06)',
        'button': '0 1px 2px 0 rgba(0, 0, 0, 0.05), 0 1px 3px 0 rgba(0, 0, 0, 0.1)',
        'button-hover': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      },
      backdropBlur: {
        xs: '2px',
        sm: '4px',
        DEFAULT: '8px',
        md: '12px',
        lg: '16px',
        xl: '24px',
        '2xl': '40px',
        '3xl': '64px',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'mesh-gradient': 'linear-gradient(to right, #ffc700 0%, #ff6b6b 50%, #4ecdc4 100%)',
        'subtle-gradient': 'linear-gradient(135deg, rgba(255, 199, 0, 0.05) 0%, rgba(255, 199, 0, 0) 100%)',
        'brand-gradient': 'linear-gradient(135deg, #FFC700 0%, #FFD12E 50%, #FFE58A 100%)',
        'dark-gradient': 'linear-gradient(135deg, #1C1917 0%, #292524 100%)',
      },
    },
  },
  plugins: [require('tailwindcss-animate'), require('@tailwindcss/typography')],
};
