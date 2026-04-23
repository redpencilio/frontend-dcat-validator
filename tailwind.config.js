import defaultTheme from 'tailwindcss/defaultTheme';
import forms from '@tailwindcss/forms';

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './app/**/*.{js,gjs,ts,gts,hbs,html}',
    './index.html',
  ],
  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: '1rem',
        lg: '3rem',
        xl: '5rem',
        '2xl': '7rem',
      },
    },
    extend: {
      fontFamily: {
        sans: ['Poppins', ...defaultTheme.fontFamily.sans],
      },
      colors: {
        rpio: {
          red: '#c41e3a',
        },
      },
    },
  },
  plugins: [forms],
};
