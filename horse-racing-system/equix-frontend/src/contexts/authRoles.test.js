import assert from 'node:assert/strict';
import test from 'node:test';
import { getStartedDestination } from './authRoles.js';

test('Get Started sends a guest to registration', () => {
  assert.equal(getStartedDestination({ sessionLoading: false, isAuthenticated: false }), '/register');
});

test('Get Started sends every authenticated role to the dashboard', () => {
  for (const role of ['ADMIN', 'HORSE_OWNER', 'JOCKEY', 'REFEREE', 'SPECTATOR']) {
    assert.equal(getStartedDestination({ sessionLoading: false, isAuthenticated: true, role }), '/dashboard');
  }
});

test('Get Started stays disabled while the stored session is being validated', () => {
  assert.equal(getStartedDestination({ sessionLoading: true, isAuthenticated: true }), null);
});

test('a pending registration without a token remains a guest', () => {
  assert.equal(getStartedDestination({ sessionLoading: false, isAuthenticated: false, status: 'PENDING' }), '/register');
});
