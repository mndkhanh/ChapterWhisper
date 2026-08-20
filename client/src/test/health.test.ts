import { describe, it, expect } from 'vitest';
import { ApiError } from '../api/http.js';

describe('Client environment & HTTP configuration', () => {
  it('instantiates ApiError with status and message', () => {
    const err = new ApiError('Conflict occurred', 409);
    expect(err).toBeInstanceOf(Error);
    expect(err.name).toBe('ApiError');
    expect(err.status).toBe(409);
    expect(err.message).toBe('Conflict occurred');
  });

  it('runs within a jsdom DOM environment with localStorage available', () => {
    expect(typeof window).toBe('object');
    expect(typeof document).toBe('object');
    expect(typeof localStorage).toBe('object');
  });
});
