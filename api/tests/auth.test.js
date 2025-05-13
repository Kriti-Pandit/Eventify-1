const request = require('supertest');
const app = require('../index');
const mongoose = require('mongoose');
const User = require('../models/User');
const bcrypt = require('bcryptjs');

describe('User Authentication API', () => {
  beforeAll(async () => {
    // Increase timeout for MongoDB connection
    jest.setTimeout(30000);
    await mongoose.connect(process.env.MONGO_URI);
  });

  afterEach(async () => {
    await User.deleteMany({});
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  describe('POST /register', () => {
    it('should register a new user with valid data', async () => {
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
    });

    it('should return 400 for missing required fields', async () => {
      const res = await request(app)
        .post('/register')
        .send({
          name: 'Incomplete User'
          // Missing email and password
        });
      
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('All fields are required');
    });
  });

  describe('POST /login', () => {
    const testUser = {
      name: 'Login Test',
      email: 'login@test.com',
      password: 'password123'
    };

    beforeEach(async () => {
      await User.create({
        ...testUser,
        password: bcrypt.hashSync(testUser.password, 10)
      });
    });

    it('should return JWT token with valid credentials', async () => {
      const res = await request(app)
        .post('/login')
        .send({
          email: testUser.email,
          password: testUser.password
        });
      
      expect(res.status).toBe(200);
      expect(res.body.email).toBe(testUser.email);
      expect(res.headers['set-cookie']).toBeDefined();
    });

    it('should return 401 for invalid credentials', async () => {
      const res = await request(app)
        .post('/login')
        .send({
          email: testUser.email,
          password: 'wrongpassword'
        });
      
      expect(res.status).toBe(401);
      expect(res.body.error).toBe('Invalid credentials');
    });
  });
});