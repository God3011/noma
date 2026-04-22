export const theme = {
    colors: {
        // Primary palette - Orange accent
        primary: '#FF6B00',
        primaryLight: '#FF9A4D',
        primaryContainer: '#3D1A00',
        onPrimary: '#1A0800',
        onPrimaryContainer: '#FFD4B3',

        // Secondary
        secondary: '#b7c4e1',
        secondaryContainer: '#2e3850',
        onSecondaryContainer: '#d3dcfe',

        // Tertiary (amber/warning)
        tertiary: '#ffb95f',
        tertiaryContainer: '#653e00',
        onTertiaryContainer: '#ffddb8',

        // Surfaces
        background: '#0D0D0D',
        surface: '#0D0D0D',
        surfaceContainerLowest: '#000000',
        surfaceContainerLow: '#181818',
        surfaceContainer: '#1E1E1E',
        surfaceContainerHigh: '#272727',
        surfaceContainerHighest: '#333333',

        // On-colors
        onBackground: '#ffffff',
        onSurface: '#ffffff',
        onSurfaceVariant: '#b0b8c1',

        // Outline
        outline: '#6b7280',
        outlineVariant: '#2a2a2a',

        // Error
        error: '#ffb4ab',
        errorContainer: '#93000a',
        onError: '#ffffff',

        // Misc
        inverseSurface: '#f5f5f5',
        inverseOnSurface: '#1E1E1E',
        inversePrimary: '#CC5500',

        // Status colors
        success: '#22c55e',
        warning: '#ffb95f',
        danger: '#ffb4ab',

        // Text
        textPrimary: '#ffffff',
        textSecondary: '#b0b8c1',
        textMuted: '#6b7280',
        textWhite: '#ffffff',
    },

    typography: {
        largeHeading: {
            fontSize: 28,
            fontWeight: '800' as const,
        },
        heading: {
            fontSize: 22,
            fontWeight: '700' as const,
        },
        sectionHeader: {
            fontSize: 18,
            fontWeight: '600' as const,
        },
        body: {
            fontSize: 15,
            fontWeight: '400' as const,
        },
        caption: {
            fontSize: 12,
            fontWeight: '400' as const,
        },
        label: {
            fontSize: 10,
            fontWeight: '600' as const,
            letterSpacing: 1.5,
            textTransform: 'uppercase' as const,
        },
    },

    spacing: {
        xs: 4,
        sm: 8,
        md: 16,
        lg: 24,
        xl: 32,
        xxl: 48,
    },

    borderRadius: {
        sm: 8,
        md: 14,
        lg: 20,
        xl: 28,
        pill: 999,
    },
};

export type Theme = typeof theme;
