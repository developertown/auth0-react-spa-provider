module.exports = {
  preset: "ts-jest",
  testEnvironment: "jsdom",
  collectCoverageFrom: ["src/**/*.{ts,js,tsx,jsx}", "!**/node_modules/**"],
  globals: {
    "ts-jest": {
      isolatedModules: true,
    },
  },
};
