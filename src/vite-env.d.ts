/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_PIG_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
