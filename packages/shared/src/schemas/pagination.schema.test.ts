import assert from 'node:assert/strict';
import { test } from 'node:test';
import { paginationQuerySchema } from './pagination.schema.ts';

test('pagination applies defaults', () => {
  assert.deepEqual(paginationQuerySchema.parse({}), { page: 1, pageSize: 20 });
});

test('pagination coerces query strings', () => {
  assert.deepEqual(paginationQuerySchema.parse({ page: '3', pageSize: '50' }), {
    page: 3,
    pageSize: 50,
  });
});

test('pagination rejects oversized pages', () => {
  assert.equal(paginationQuerySchema.safeParse({ pageSize: '500' }).success, false);
});
