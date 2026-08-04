import type { Config } from "jest";

const config: Config = {
    testEnvironment: "jsdom",
    transform: {
        "^.+\\.(ts|tsx)$": "babel-jest",
    },
    moduleNameMapper: {
        "^@/(.*)$": "<rootDir>/src/$1",
        "^@components/(.*)$": "<rootDir>/src/components/$1",
        "^@stores/(.*)$": "<rootDir>/src/stores/$1",
        "^@assets/(.*)$": "<rootDir>/src/assets/$1",
    },
    testMatch: ["**/__tests__/**/*.(test|spec).(ts|tsx)"],
    collectCoverageFrom: [
        "src/**/*.{ts,tsx}",
        "!src/**/*.d.ts",
        "!src/main.tsx",
        "!src/vite-env.d.ts",
    ],
    coverageDirectory: "coverage",
    coverageReporters: ["text", "lcov"],
};

export default config;