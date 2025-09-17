import js from "@eslint/js";
import tsParser from "@typescript-eslint/parser";
import tsPlugin from "@typescript-eslint/eslint-plugin";

export default [
  js.configs.recommended,
  {
    ignores: [
      "**/node_modules/**/*",
      "**/.next/**/*",
      "**/dist/**/*", 
      "**/build/**/*",
      "**/public/**/*",
      "**/src/generated/**/*",
      "**/coverage/**/*",
      "**/webpack.config.js",
      "**/tailwind.config.js",
      "**/jest.config.js",
      "**/test-*.js",
      "**/tsup.config.ts",
      "**/postcss.config.js",
      "**/next.config.js",
      "**/setup-env.js",
    ],
    files: ["**/*.{js,jsx,ts,tsx}"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
      },
      globals: {
        // Browser globals
        window: true,
        document: true,
        console: true,
        fetch: true,
        URL: true,
        URLSearchParams: true,
        Headers: true,
        Response: true,
        Request: true,
        File: true,
        FormData: true,
        Blob: true,
        location: true,
        navigator: true,
        MouseEvent: true,
        HTMLElement: true,
        HTMLDivElement: true,
        HTMLInputElement: true,
        WebAssembly: true,
        TextEncoder: true,
        TextDecoder: true,
        localStorage: true,
        sessionStorage: true,
        alert: true,
        
        // Runtime APIs
        setTimeout: true,
        clearTimeout: true,
        setImmediate: true,
        performance: true,
        self: true,
        atob: true,
        btoa: true,

        // Node.js globals
        global: true,
        module: true,
        exports: true,
        require: true,
        __dirname: true,
        process: true,
        Buffer: true,

        // Streams
        ReadableStream: true,
        WritableStream: true,
        TransformStream: true,

        // Web APIs
        AbortController: true,
        AbortSignal: true,

        // WASM Engine exports
        empty: true,
        skip: true,
        join: true,
        sqltag: true,
        raw: true,
        createParam: true,
        defineDmmfProperty: true,
        getPrismaClient: true,
        getRuntime: true,
        makeStrictEnum: true,
        makeTypedQueryFactory: true,
        objectEnumValues: true,
        serializeJsonQuery: true,
        deserializeJsonResponse: true,
        deserializeRawResult: true,
        dmmfToRuntimeDataModel: true,
        warnEnvConflicts: true,
        warnOnce: true,
        DMMF: true,
        Debug: true,
        Decimal: true,
        Extensions: true,
        Public: true,
        Sql: true,
        MetricsClient: true,
        OS: true,
        PrismaClientInitializationError: true,
        PrismaClientKnownRequestError: true,
        PrismaClientRustPanicError: true,
        PrismaClientUnknownRequestError: true,
        PrismaClientValidationError: true
      }
    },
    plugins: {
      "@typescript-eslint": tsPlugin,
    },
    rules: {
      ...tsPlugin.configs.recommended.rules,
      
      // Disable some TypeScript specific rules that are too strict
      "@typescript-eslint/no-unused-vars": ["error", { 
        "argsIgnorePattern": "^_",
        "varsIgnorePattern": "^_",
        "ignoreRestSiblings": true
      }],
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-empty-function": "off", 
      "@typescript-eslint/no-non-null-assertion": "off",
      "@typescript-eslint/ban-ts-comment": "off",
      "@typescript-eslint/ban-types": "off",
      "@typescript-eslint/no-empty-interface": "off",
      "@typescript-eslint/no-namespace": "off",
      "@typescript-eslint/no-var-requires": "off",
      "@typescript-eslint/triple-slash-reference": "off",
      "@typescript-eslint/no-this-alias": "off",

      // Disable some ESLint rules that are too strict
      "no-unused-vars": "off", // Use @typescript-eslint/no-unused-vars instead
      "no-undef": "off", // TypeScript handles this
      "no-empty": "off",
      "no-constant-binary-expression": "off",
      "no-prototype-builtins": "off",
      "no-control-regex": "off",
      "no-func-assign": "off",
      "no-redeclare": "off",
      "no-unreachable": "off",
      "no-cond-assign": "off",
      "no-useless-escape": "off",
      "no-extra-boolean-cast": "off",
    },
  },
];
