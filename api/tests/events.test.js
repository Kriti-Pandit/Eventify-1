const request = require('supertest');
const app = require('../index');
const mongoose = require('mongoose');
const User = require('../models/User');
const Event = require('../models/Event');

describe('Event Management API', () => {
  let authToken;
  let testUser;

  beforeAll(async () => {
    jest.setTimeout(30000);
    await mongoose.connect(process.env.MONGO_URI);
  });

  beforeEach(async () => {
    testUser = await User.create({
      name: 'Event Tester',
      email: 'event@test.com',
      password: 'hashedpassword'
    });

    const loginRes = await request(app)
      .post('/login')
      .send({
        email: 'event@test.com',
        password: 'password123'
      });

    authToken = loginRes.headers['set-cookie'][0].split(';')[0];
  });

  afterEach(async () => {
    await Event.deleteMany({});
    await User.deleteMany({});
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  describe('POST /createEvent', () => {
    const validEventData = {
      title: 'Test Event',
      description: 'Test Description',
      organizedBy: 'Test Org',
      eventDate: '2023-12-31',
      eventTime: '19:00',
      location: 'Test Location',
      maxParticipants: 100,
      ticketPrice: 10,
      availableTickets: 100
    };

    it('should create event with valid data', async () => {
      const res = await request(app)
        .post('/createEvent')
        .set('Cookie', authToken)
        .send(validEventData);
      
      expect(res.status).toBe(201);
      expect(res.body.title).toBe(validEventData.title);
      expect(res.body.owner).toBe(testUser._id.toString());
    });

    it('should return 401 without authentication', async () => {
      const res = await request(app)
        .post('/createEvent')
        .send(validEventData);
      
      expect(res.status).toBe(401);
    });
  });

  describe('GET /events', () => {
    it('should retrieve all events', async () => {
      await Event.create([
        {
          owner: testUser._id,
          title: 'Event 1',
          description: 'Desc 1',
          organizedBy: 'Org 1',
          eventDate: new Date(),
          eventTime: '10:00',
          location: 'Location 1',
          maxParticipants: 50,
          ticketPrice: 20,
          availableTickets: 50
        }
      ]);

      const res = await request(app).get('/events');
      
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(1);
      expect(res.body[0].title).toBe('Event 1');
    });
  });
});