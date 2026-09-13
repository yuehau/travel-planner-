import { describe, expect, it } from 'vitest';
import { getAuthErrorMessage } from './authErrors';

describe('getAuthErrorMessage', () => {
  it('maps disabled Google provider errors to setup guidance', () => {
    expect(getAuthErrorMessage(new Error('Unsupported provider: provider is not enabled'))).toContain('Google sign-in is not enabled');
    expect(getAuthErrorMessage({ msg: 'Unsupported provider: provider is not enabled' })).toContain('Google sign-in is not enabled');
  });

  it('falls back to the original error message', () => {
    expect(getAuthErrorMessage(new Error('Something else'))).toBe('Something else');
  });
});
