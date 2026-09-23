import { validate } from './env.validation';

describe('validate (environment variables)', () => {
  const valid = {
    DATABASE_URL: 'postgresql://kanban:kanban@localhost:5433/kanban',
    JWT_SECRET: 'a-secret-long-enough-for-the-tests',
  };

  it('accepts minimal configuration and applies default values', () => {
    const env = validate(valid);
    expect(env.JWT_EXPIRES_IN).toBe('1h');
    expect(env.PORT).toBe(3000);
  });

  it('converts PORT to a number', () => {
    expect(validate({ ...valid, PORT: '4000' }).PORT).toBe(4000);
  });

  it('rejects missing DATABASE_URL and names the variable', () => {
    expect(() => validate({ JWT_SECRET: valid.JWT_SECRET })).toThrow(/DATABASE_URL/);
  });

  it('rejects a JWT_SECRET that is too short', () => {
    expect(() => validate({ ...valid, JWT_SECRET: 'short' })).toThrow(/JWT_SECRET/);
  });
});
