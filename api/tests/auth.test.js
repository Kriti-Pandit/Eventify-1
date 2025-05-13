const request = require('supertest');
const mongoose = require('mongoose');
const { app, server } = require('../index'); // Destructure the exports
const User = require('../models/User');
const bcrypt = require('bcryptjs');

// Use a test-specific port
process.env.PORT = 0;

describe('User Authentication API', () => {
  beforeAll(async () => {
    await mongoose.connect(process.env.MONGO_URI);
  });

  afterEach(async () => {
    await User.deleteMany({}); // Cleanup users after each test
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await server.close(); // Shut down the server
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
    });

    it('should fail with missing fields', async () => {
      const res = await request(app)
        .post('/register')
        .send({ name: 'Incomplete User' });
      
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
      expect(res.headers['set-cookie']).toBeDefined(); // Check for JWT cookie
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
  });
});