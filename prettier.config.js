/** @type {import('prettier').Config & import('prettier-plugin-tailwindcss').PluginOptions} */
export default {
  semi: false,
  singleQuote: true,
  printWidth: 100,
  plugins: ['prettier-plugin-tailwindcss'],
  tailwindStylesheet: './src/app/styles/index.css',
  tailwindFunctions: ['cva', 'cn'],
}
