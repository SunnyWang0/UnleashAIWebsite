
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./dist/**/*.html",
  ],
  darkMode: 'class',
  theme: {
    fontFamily: {
      'IBMPlexSerif': ['IBM Plex Serif', 'serif'],
      'SpaceGrotesk': ['Space Grotesk', 'sans-serif'],
      'Manrope': ['Manrope', 'sans-serif'],
      'Unicons': ['Unicons'],
      'Monospace': ['SFMono-Regular,Menlo,Monaco,Consolas,"Liberation Mono","Courier New",monospace'],
      'Custom': ['Custom'],
      'DMSerif': ['DM Serif Display'],
      'SansSerif': ['sans-serif'],
      'THICCCBOI': ['THICCCBOI', 'sans-serif'],
      'Urbanist': ['Urbanist', 'sans-serif'],
    },
    container: {
      center: true,
      padding: '15px',
    },
    extend: {
      screens: {
        'xxl': {
          'min': '1400px',
        },
        'xl': {
          'min': '1200px',
        },
        'lg': {
          'min': '992px',
          'max': '1199.98px'
        },
        'md': {
          'min': '768px',
          'max': '991.98px'
        },
        'sm': {
          'min': '576px',
          'max': '767.98px'
        },
        'xsm': {
          'max': '575.98px'
        },
      },
    },
  },
  plugins: [
    function ({
    addComponents
  }) {
    addComponents({
      '.container': {
        maxWidth: '100%',
        '@screen sm': {
          maxWidth: '540px',
        },
        '@screen md': {
          maxWidth: '720px',
        },
        '@screen lg': {
          maxWidth: '960px',
        },
        '@screen xl': {
          maxWidth: '1140px',
        },
        '@screen xxl': {
          maxWidth: '1320px',
        },
      }
    })
  }],
}
