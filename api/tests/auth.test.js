const request = require('supertest');
const mongoose = require('mongoose');
const { app, startServer, stopServer } = require('../index');
const User = require('../models/User');
const bcrypt = require('bcryptjs');

describe('User Authentication API', () => {
  beforeAll(async () => {
    // Start the server before all tests
    await startServer();
  });

  afterEach(async () => {
    // Clean up the database after each test
    await User.deleteMany({});
  });

  afterAll(async () => {
    // Close the server and MongoDB connection after all tests
    await stopServer();
  });

  describe('POST /register', () => {
    it('should register a new user', async () => {
      const res = await request(app)
        .post('/register')
        .send({
          name: 'Test User',
          email: 'test@example.com',
          password: 'password123'
        });
      
      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('_id');
      expect(res.body.email).toBe('test@example.com');
      expect(res.body.name).toBe('Test User');
    });

    it('should fail with missing fields', async () => {
      const res = await request(app)
        .post('/register')
        .send({ name: 'Incomplete User' });
      
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('All fields are required');
    });

    it('should fail with duplicate email', async () => {
      // First create a user
      await request(app)
        .post('/register')
        .send({
          name: 'Test User',
          email: 'test@example.com',
          password: 'password123'
        });

      // Try to create another user with same email
      const res = await request(app)
        .post('/register')
        .send({
          name: 'Test User 2',
          email: 'test@example.com',
          password: 'password123'
        });

      expect(res.status).toBe(409);
      expect(res.body.error).toBe('Email already in use');
    });
  });

  describe('POST /login', () => {
    const testUser = {
      name: 'Login Test',
      email: 'login@test.com',
      password: 'password123'
    };

    beforeEach(async () => {
      // Pre-create a user for login tests
      await User.create({
        ...testUser,
        password: bcrypt.hashSync(testUser.password, 10)
      });
    });

    it('should login with valid credentials', async () => {
      const res = await request(app)
        .post('/login')
        .send({
          email: testUser.email,
          password: testUser.password
        });
      
      expect(res.status).toBe(200);
      expect(res.body.email).toBe(testUser.email);
      expect(res.body.name).toBe(testUser.name);
      expect(res.headers['set-cookie']).toBeDefined();
    });

    it('should reject invalid password', async () => {
      const res = await request(app)
        .post('/login')
        .send({
          email: testUser.email,
          password: 'wrongpassword'
        });
      
      expect(res.status).toBe(401);
      expect(res.body.error).toBe('Invalid credentials');
    });

    it('should reject non-existent email', async () => {
      const res = await request(app)
        .post('/login')
        .send({
          email: 'nonexistent@test.com',
          password: 'password123'
        });
      
      expect(res.status).toBe(401);
      expect(res.body.error).toBe('Invalid credentials');
    });
  });

  describe('POST /logout', () => {
    it('should clear the authentication cookie', async () => {
      const res = await request(app)
        .post('/logout')
        .send();
      
      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Logged out successfully');
      expect(res.headers['set-cookie']).toBeDefined();
      expect(res.headers['set-cookie'][0]).toContain('token=;');
    });
  });

  describe('GET /profile', () => {
    const testUser = {
      name: 'Profile Test',
      email: 'profile@test.com',
      password: 'password123'
    };

    let authToken;

    beforeEach(async () => {
      // Create and login a user
      const user = await User.create({
        ...testUser,
        password: bcrypt.hashSync(testUser.password, 10)
      });

      const loginRes = await request(app)
        .post('/login')
        .send({
          email: testUser.email,
          password: testUser.password
        });

      authToken = loginRes.headers['set-cookie'][0].split(';')[0].split('=')[1];
    });

    it('should return user profile when authenticated', async () => {
      const res = await request(app)
        .get('/profile')
        .set('Cookie', [`token=${authToken}`]);
      
      expect(res.status).toBe(200);
      expect(res.body.email).toBe(testUser.email);
      expect(res.body.name).toBe(testUser.name);
    });

    it('should reject unauthenticated requests', async () => {
      const res = await request(app)
        .get('/profile');
      
      expect(res.status).toBe(401);
      expect(res.body.error).toBe('Not authenticated');
    });
  });
});