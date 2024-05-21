// tailwind.config.test.js
const config = require('../tailwind.config.js');

test('config should be an object', () => {
  expect(typeof config).toBe('object');
});

test('config should have correct properties', () => {
  expect(config).toHaveProperty('content');
  expect(config).toHaveProperty('theme');
  expect(config).toHaveProperty('plugins');
});

test('config content should be an array', () => {
  expect(Array.isArray(config.content)).toBe(true);
});

test('config theme should be an object', () => {
  expect(typeof config.theme).toBe('object');
});

test('config plugins should be an array', () => {
  expect(Array.isArray(config.plugins)).toBe(true);
});