/** @type {import('postcss-load-config').Config} */
const config = {
  plugins: {
    '@tailwindcss/postcss': {}, // <-- Se agrega '@tailwindcss/postcss' en lugar de 'tailwindcss'
    autoprefixer: {},
  },
};

export default config;
