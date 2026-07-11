const { heroui } = require('@heroui/react')

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/renderer/index.html',
    './src/renderer/src/**/*.{js,ts,jsx,tsx}',
    // npm не гарантирует, что @heroui/theme захостится в плоский
    // node_modules/@heroui/theme — на практике он остаётся только во
    // вложенных копиях внутри node_modules каждого @heroui/*-пакета
    // (react, system, form...). Глоб идёт на один уровень вглубь каждого
    // @heroui/*, а не рекурсивно по всему node_modules — иначе сборка
    // становится минутной. Покрывает .mjs-чанки, откуда реально берутся
    // строки классов вроде bg-content1/rounded-large.
    './node_modules/@heroui/*/node_modules/@heroui/theme/dist/**/*.{js,mjs}'
  ],
  darkMode: 'class',
  theme: {
    extend: {}
  },
  plugins: [heroui()]
}
