import clamp from './clamp';

describe('works in the positive ranges', () => {
  test('returns the input in range min..max', () => {
    expect(clamp(10, 10, 20)).toBe(10);
    expect(clamp(20, 10, 20)).toBe(20);
  });

  test('returns the maximum for values greater than the maximum', () => {
    expect(clamp(21, 10, 20)).toBe(20);
    expect(clamp(200, 10, 20)).toBe(20);
    expect(clamp(20000, 10, 20)).toBe(20);
  });

  test('returns the minimum for values less than the minimum', () => {
    expect(clamp(9, 10, 20)).toBe(10);
    expect(clamp(0, 10, 20)).toBe(10);
    expect(clamp(-10, 10, 20)).toBe(10);
  });
});

describe('works in negative ranges', () => {
  test('returns the input in range min..max', () => {
    expect(clamp(-100, -100, -20)).toBe(-100);
    expect(clamp(-20, -100, -20)).toBe(-20);
  });

  test('returns the maximum for values greater than the maximum', () => {
    expect(clamp(-9, -20, -10)).toBe(-10);
    expect(clamp(0, -20, -10)).toBe(-10);
    expect(clamp(200, -20, -10)).toBe(-10);
  });

  test('returns the minimum for values less than the minimum', () => {
    expect(clamp(-21, -20, -10)).toBe(-20);
    expect(clamp(-100, -20, -10)).toBe(-20);
    expect(clamp(-10000, -20, -10)).toBe(-20);
  });
});
