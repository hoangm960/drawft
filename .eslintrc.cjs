module.exports = {
    root: true,
    env: { browser: true, es2020: true },
    extends: [
        "eslint:recommended",
        "@typescript-eslint/recommended",
        "plugin:react-hooks/recommended",
        "plugin:react/recommended",
        "plugin:react/jsx-runtime",
    ],
    ignorePatterns: ["dist", ".eslintrc.cjs", "storybook-static"],
    parser: "@typescript-eslint/parser",
    plugins: ["react-refresh", "@typescript-eslint"],
    settings: {
        react: {
            version: "detect",
        },
    },
    rules: {
        "react-refresh/only-export-components": [
            "warn",
            { allowConstantExport: true },
        ],
        "@typescript-eslint/no-unused-vars": [
            "error",
            { argsIgnorePattern: "^_" },
        ],
        "react/prop-types": "off",
        "@typescript-eslint/explicit-function-return-type": "off",
        "@typescript-eslint/no-explicit-any": "warn",
    },
};
