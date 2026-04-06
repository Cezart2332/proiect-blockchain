import { defineConfig } from 'vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'

const basePath = process.env.VITE_BASE_PATH ?? '/'

// https://vite.dev/config/
export default defineConfig({
  base: basePath,
  plugins: [
    react(),
    babel({ presets: [reactCompilerPreset()] })
  ],
})
