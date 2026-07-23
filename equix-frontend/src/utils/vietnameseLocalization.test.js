import test from 'node:test';
import assert from 'node:assert/strict';
import { translateText } from './vietnameseLocalization.js';

test('translates common EquiX labels and statuses', () => {
  assert.equal(translateText('All Races'), 'Tất cả cuộc đua');
  assert.equal(translateText('REGISTRATION_OPEN'), 'Đang mở đăng ký');
  assert.equal(translateText('HORSE_OWNER'), 'Chủ ngựa');
});

test('changes displayed currency unit to point', () => {
  assert.equal(translateText('250,000 VND'), '250,000 point');
  assert.equal(translateText('Prize pool (VND)'), 'Tổng điểm thưởng (point)');
});

test('translates dynamic race summary text', () => {
  assert.equal(translateText('Showing 6 of 8 races'), 'Đang hiển thị 6/8 cuộc đua');
  assert.equal(translateText('Up to 12 pairs'), 'Tối đa 12 cặp');
});

test('translates database statuses and notification content', () => {
  assert.equal(translateText('OPEN'), 'Đang mở');
  assert.equal(translateText('LOCKED'), 'Đã khóa');
  assert.equal(translateText('CLEARED TO RACE'), 'Đủ điều kiện thi đấu');
  assert.equal(translateText('RACE_STARTED'), 'Cuộc đua đã bắt đầu');
  assert.equal(
    translateText('Saigon Championship Sprint is now in progress'),
    'Saigon Championship Sprint hiện đang diễn ra',
  );
});
