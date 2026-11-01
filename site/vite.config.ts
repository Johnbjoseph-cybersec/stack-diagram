import { defineConfig, lazyPlugins } from "vite-plus";

const GENERATED = [
  "**/routeTree.gen.ts",
  "worker-configuration.d.ts",
  "**/dist/**",
  "**/.wrangler/**",
  "**/.css-types/**",
  "drizzle/**",
];

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  plugins: lazyPlugins(async () => {
    // Unit tests cover pure modules; the Workers plugin would need a Cloudflare token for the remote AI binding
    if (process.env.VITEST) {
      return [];
    }
    const [{ cloudflare }, { tanstackStart }, { default: react }] = await Promise.all([
      import("@cloudflare/vite-plugin"),
      import("@tanstack/react-start/plugin/vite"),
      import("@vitejs/plugin-react"),
    ]);
    return [
      cloudflare({ viteEnvironment: { name: "ssr" } }),
      // prettier 3.9's TypeScript parser throws inside the route generator; oxfmt skips the tree anyway
      tanstackStart({ router: { enableRouteTreeFormatting: false } }),
      react(),
    ];
  }),
  fmt: {
    sortImports: true,
    ignorePatterns: [...GENERATED, "pnpm-lock.yaml"],
  },
  lint: {
    plugins: ["typescript", "unicorn", "oxc", "react", "promise", "import"],
    jsPlugins: [{ name: "vite-plus", specifier: "vite-plus/oxlint-plugin" }],
    categories: {
      correctness: "error",
      suspicious: "warn",
    },
    options: {
      typeAware: true,
    },
    env: {
      builtin: true,
    },
    rules: {
      "typescript/no-unnecessary-type-assertion": "error",
      "typescript/consistent-type-assertions": ["error", { assertionStyle: "never" }],
      "typescript/no-unnecessary-boolean-literal-compare": "error",
      "typescript/no-unnecessary-template-expression": "error",
      "typescript/no-unnecessary-type-arguments": "error",
      "typescript/no-unsafe-enum-comparison": "error",
      "typescript/no-confusing-non-null-assertion": "error",
      "typescript/no-non-null-asserted-nullish-coalescing": "error",
      "typescript/no-import-type-side-effects": "error",
      "typescript/use-unknown-in-catch-callback-variable": "error",
      "typescript/no-floating-promises": "error",
      "typescript/await-thenable": "error",
      "eslint/no-shadow": "error",
      "eslint/no-unneeded-ternary": "error",
      "eslint/no-underscore-dangle": ["warn", { allow: ["_splat"] }],
      "eslint/prefer-const": "error",
      "eslint/preserve-caught-error": "error",
      "eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_", caughtErrorsIgnorePattern: "^_" },
      ],
      "promise/no-multiple-resolved": "error",
      "react/button-has-type": "error",
      "react/jsx-no-script-url": "error",
      "react/react-in-jsx-scope": "off",
      "unicorn/prefer-node-protocol": "error",
      "oxc/no-barrel-file": ["error", { threshold: 1 }],
      "import/no-cycle": "error",
      "import/no-unassigned-import": "off",
      "vite-plus/prefer-vite-plus-imports": "error",
    },
    ignorePatterns: GENERATED,
    overrides: [
      {
        files: ["src/features/**"],
        rules: {
          "eslint/no-restricted-imports": [
            "error",
            {
              patterns: [
                {
                  group: ["@/features/*", "@/features/**"],
                  message:
                    "Features must not import each other. Move shared code to src/components or src/lib.",
                },
              ],
            },
          ],
        },
      },
      {
        files: ["**/*.test.ts"],
        rules: {
          "typescript/consistent-type-assertions": "off",
        },
      },
    ],
  },
  test: {
    include: ["src/**/*.test.ts"],
  },
});
