// Polyfill for crypto.getRandomValues for environments like jsdom
if (typeof global.crypto === "undefined") {
  global.crypto = {};
}
if (typeof global.crypto.getRandomValues === "undefined") {
  global.crypto.getRandomValues = function (buffer) {
    for (let i = 0; i < buffer.length; i++) {
      buffer[i] = Math.floor(Math.random() * 256);
    }
    return buffer;
  };
}

import util from "@madie/madie-util";
// Mock SystemJS
global.System = {
  import: jest.fn(mockImport),
};

beforeAll(() => {
  jest.spyOn(console, "error").mockImplementation(() => {});
  jest.spyOn(console, "warn").mockImplementation(() => {});
});

afterAll(() => {
  console.error.mockRestore();
  console.warn.mockRestore();
});

// Mock localStorage for jsdom/CI environments
if (
  typeof window !== "undefined" &&
  typeof window.localStorage === "undefined"
) {
  window.localStorage = {
    getItem: jest.fn(() => null),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
  };
}
if (
  typeof global !== "undefined" &&
  typeof global.localStorage === "undefined"
) {
  global.localStorage = {
    getItem: jest.fn(() => null),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
  };
}

function mockImport(importName) {
  if (importName === "@madie/madie-util") {
    return Promise.resolve(util);
  } else {
    console.warn("No mock module found");
    return Promise.resolve({});
  }
}
