import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import ts from "typescript";
import { fileURLToPath } from "node:url";
// TypeScript's in-process transform also builds in restricted Windows hosts
// that do not allow child executable processes (esbuild's native service).
export default defineConfig({
  base: "./",
  plugins: [
    {
      name: "typescript-in-process",
      enforce: "pre",
      transform(code, id) {
        if (!/\.[cm]?[tj]sx?(?:\?.*)?$/.test(id)) return null;
        code = code.replaceAll("process.env.NODE_ENV", '"production"');
        if (id.includes("/node_modules/")) return { code, map: null };
        return {
          code: ts.transpileModule(code, {
            compilerOptions: {
              target: ts.ScriptTarget.ES2022,
              module: ts.ModuleKind.ESNext,
              jsx: ts.JsxEmit.ReactJSX,
              sourceMap: false,
            },
          }).outputText,
          map: null,
        };
      },
    },
    tailwindcss(),
  ],
  esbuild: false,
  resolve: {
    preserveSymlinks: true,
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  build: {
    minify: false,
    cssMinify: false,
    chunkSizeWarningLimit: 1500,
    rollupOptions: {
      output: { manualChunks: { three: ["three"], math: ["katex"] } },
    },
  },
});
