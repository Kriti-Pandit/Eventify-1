const request = require('supertest');
const { app, startServer, stopServer } = require('../index');

describe('Smoke Tests', () => {
  beforeAll(async () => {
    await startServer();
  });

  afterAll(async () => {
    await stopServer();
  });

  it('should respond to health check', async () => {
    const res = await request(app)
      .get('/api/health')
      .expect(200);
    
    expect(res.body.status).toBe('healthy');
    expect(res.body.timestamp).toBeDefined();
  });

  it('should connect to MongoDB', async () => {
    const mongoose = require('mongoose');
    expect(mongoose.connection.readyState).toBe(1); // 1 = connected
  });

  it('should have all required environment variables', () => {
    expect(process.env.MONGO_URI).toBeDefined();
    expect(process.env.JWT_SECRET).toBeDefined();
  });

  it('should return 404 for non-existent routes', async () => {
    await request(app)
      .get('/non-existent-route')
      .expect(404);
  });
});