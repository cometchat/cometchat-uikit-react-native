import addOpacity from './addOpacity';

describe('Converts color #rrggbb to #rrggbbaa', () => {
  test('Should return #0000001A for opacity 0.1 (10%)', () => {
    const color = '#000000';
    const opacity = 0.1;
    const after = '#0000001A';
    expect(addOpacity(color, opacity)).toBe(after);
  });
  test('Should return #00000040 for opacity 0.25 (25%)', () => {
    const color = '#000000';
    const opacity = 0.25;
    const after = '#00000040';
    expect(addOpacity(color, opacity)).toBe(after);
  });
  test('Should return #0000007F for opacity 0.5 (50%)', () => {
    const color = '#000000';
    const opacity = 0.5;
    const after = '#00000080';
    expect(addOpacity(color, opacity)).toBe(after);
  });
  test('Should return #000000BF for opacity 0.75 (75%)', () => {
    const color = '#000000';
    const opacity = 0.75;
    const after = '#000000BF';
    expect(addOpacity(color, opacity)).toBe(after);
  });
  test('Should return #000000FF for opacity 1 (100%)', () => {
    const color = '#000000';
    const opacity = 1;
    const after = '#000000FF';
    expect(addOpacity(color, opacity)).toBe(after);
  });
});

describe('Handle opacity out of range (less then 0 or greater than 1)', () => {
  test('Should return #000000FF for an opacity greater than 1', () => {
    const color = '#000000';
    const opacity = 100;
    const after = '#000000FF';
    expect(addOpacity(color, opacity)).toBe(after);
  });
  test('Should return #000000FF for an opacity less than 0', () => {
    const color = '#000000';
    const opacity = -20;
    const after = '#00000000';
    expect(addOpacity(color, opacity)).toBe(after);
  });
});
