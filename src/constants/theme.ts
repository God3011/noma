export const theme = {
    colors: {
        // Primary palette
        primary: '#10b981',
        primaryLight: '#4edea3',
        primaryContainer: '#005236',
        onPrimary: '#002113',
        onPrimaryContainer: '#6ffbbe',

        // Secondary
        secondary: '#b7c8e1',
        secondaryContainer: '#38485d',
        onSecondaryContainer: '#d3e4fe',

        // Tertiary (amber/warning)
        tertiary: '#ffb95f',
        tertiaryContainer: '#653e00',
        onTertiaryContainer: '#ffddb8',

        // Surfaces
        background: '#131313',
        surface: '#131313',
        surfaceContainerLowest: '#000000',
        surfaceContainerLow: '#1c1b1b',
        surfaceContainer: '#191c1e',
        surfaceContainerHigh: '#2d3133',
        surfaceContainerHighest: '#353534',

        // On-colors
        onBackground: '#ffffff',
        onSurface: '#ffffff',
        onSurfaceVariant: '#bbcabf',

        // Outline
        outline: '#8a938c',
        outlineVariant: '#3c4a42',

        // Error
        error: '#ffb4ab',
        errorContainer: '#93000a',
        onError: '#ffffff',

        // Misc
        inverseSurface: '#f7f9fb',
        inverseOnSurface: '#191c1e',
        inversePrimary: '#006c49',

        // Status colors
        success: '#10b981',
        warning: '#ffb95f',
        danger: '#ffb4ab',

        // Text
        textPrimary: '#ffffff',
        textSecondary: '#bbcabf',
        textMuted: '#8a938c',
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
