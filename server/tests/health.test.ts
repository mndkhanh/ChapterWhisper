import request from 'supertest';
import { describe, expect, it } from 'vitest';

const { createApp } = await import('../src/app.js');
const app = createApp();

describe('GET /api/health', () => {
  it('returns status ok and server confirmation message', async () => {
    const res = await request(app).get('/api/health');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      status: 'ok',
      message: 'ChapterWhisper Server is running',
    });
  });
});
