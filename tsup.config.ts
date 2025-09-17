import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/widget/index.tsx'],
  outDir: 'public/widget',
  format: 'iife',
  globalName: 'FeedbackFlowWidget',
  platform: 'browser',
  minify: true,
  clean: true,
  noExternal: ['react', 'react-dom']
});