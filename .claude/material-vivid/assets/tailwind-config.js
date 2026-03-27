/**
 * Material Vivid - Tailwind CSS Configuration
 * Google Stitch (Material You 3) 기반 디자인 시스템
 */

tailwind.config = {
  darkMode: "class",
  theme: {
    extend: {
      // ===== 색상 시스템 =====
      colors: {
        // Primary
        primary: {
          DEFAULT: "var(--color-primary)",
          container: "var(--color-primary-container)",
        },
        // Secondary
        secondary: {
          DEFAULT: "var(--color-secondary)",
          container: "var(--color-secondary-container)",
        },
        // Tertiary
        tertiary: {
          DEFAULT: "var(--color-tertiary)",
          container: "var(--color-tertiary-container)",
        },
        // Surface
        surface: {
          DEFAULT: "var(--color-surface)",
          dim: "var(--color-surface-dim)",
          bright: "var(--color-surface-bright)",
          container: {
            lowest: "var(--color-surface-container-lowest)",
            low: "var(--color-surface-container-low)",
            DEFAULT: "var(--color-surface-container)",
            high: "var(--color-surface-container-high)",
            highest: "var(--color-surface-container-highest)",
          },
        },
        // On Colors
        on: {
          surface: "var(--color-on-surface)",
          "surface-variant": "var(--color-on-surface-variant)",
          primary: "var(--color-on-primary)",
          "primary-container": "var(--color-on-primary-container)",
          secondary: "var(--color-on-secondary)",
          tertiary: "var(--color-on-tertiary)",
        },
        // Outline
        outline: {
          DEFAULT: "var(--color-outline)",
          variant: "var(--color-outline-variant)",
        },
        // Error
        error: {
          DEFAULT: "var(--color-error)",
          container: "var(--color-error-container)",
        },
        // Trend Indicators
        trend: {
          up: "var(--color-trend-up)",
          down: "var(--color-trend-down)",
          neutral: "var(--color-trend-neutral)",
        },
      },

      // ===== 폰트 =====
      fontFamily: {
        display: ["'Inter'", "'Roboto Flex'", "-apple-system", "sans-serif"],
        body: ["'Inter'", "'Roboto Flex'", "sans-serif"],
        mono: ["'Roboto Mono'", "'Source Code Pro'", "monospace"],
      },

      // ===== 테두리 반경 =====
      borderRadius: {
        "4xl": "2rem",
        "5xl": "2.5rem",
      },

      // ===== 그림자 (Elevation) =====
      boxShadow: {
        "elevation-1": "0 1px 2px rgba(0,0,0,0.1), 0 1px 3px rgba(0,0,0,0.08)",
        "elevation-2": "0 2px 4px rgba(0,0,0,0.1), 0 2px 6px rgba(0,0,0,0.08)",
        "elevation-3": "0 4px 8px rgba(0,0,0,0.1), 0 4px 12px rgba(0,0,0,0.08)",
        "elevation-4": "0 6px 12px rgba(0,0,0,0.1), 0 8px 24px rgba(0,0,0,0.08)",
        "elevation-5": "0 8px 16px rgba(0,0,0,0.1), 0 12px 32px rgba(0,0,0,0.08)",
      },

      // ===== 애니메이션 =====
      animation: {
        "fade-in-up": "fadeInUp 0.3s cubic-bezier(0.05, 0.7, 0.1, 1) forwards",
        "fade-in-scale": "fadeInScale 0.3s cubic-bezier(0.05, 0.7, 0.1, 1) forwards",
        "slide-in-left": "slideInLeft 0.3s cubic-bezier(0.05, 0.7, 0.1, 1) forwards",
        shimmer: "shimmer 1.5s infinite",
        "spin-slow": "spin 1.5s linear infinite",
      },

      keyframes: {
        fadeInUp: {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        fadeInScale: {
          "0%": { opacity: "0", transform: "scale(0.95)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        slideInLeft: {
          "0%": { opacity: "0", transform: "translateX(-24px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "200% 0" },
          "100%": { backgroundPosition: "-200% 0" },
        },
      },

      // ===== 트랜지션 타이밍 =====
      transitionTimingFunction: {
        standard: "cubic-bezier(0.2, 0, 0, 1)",
        "standard-decelerate": "cubic-bezier(0, 0, 0, 1)",
        "standard-accelerate": "cubic-bezier(0.3, 0, 1, 1)",
        emphasized: "cubic-bezier(0.2, 0, 0, 1)",
        "emphasized-decelerate": "cubic-bezier(0.05, 0.7, 0.1, 1)",
        "emphasized-accelerate": "cubic-bezier(0.3, 0, 0.8, 0.15)",
      },

      // ===== 트랜지션 지속시간 =====
      transitionDuration: {
        short: "150ms",
        medium: "300ms",
        long: "500ms",
      },
    },
  },
};
