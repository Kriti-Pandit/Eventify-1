const request = require('supertest');
const mongoose = require('mongoose');
const { app, startServer, stopServer, Event } = require('../index');
const User = require('../models/User');
const Ticket = require('../models/Ticket');
const bcrypt = require('bcryptjs');

describe('Ticket API', () => {
  let authToken;
  let testUser;
  let testEvent;

  beforeAll(async () => {
    await startServer();
  });

  beforeEach(async () => {
    // Create test user
    testUser = await User.create({
      name: 'Ticket Test User',
      email: 'ticketuser@test.com',
      password: bcrypt.hashSync('password123', 10)
    });

    // Login to get auth token
    const loginRes = await request(app)
      .post('/login')
      .send({
        email: 'ticketuser@test.com',
        password: 'password123'
      });
    authToken = loginRes.headers['set-cookie'][0].split(';')[0].split('=')[1];

    // Create test event
    testEvent = await Event.create({
      owner: testUser._id,
      title: 'Test Event',
      description: 'This is a test event',
      organizedBy: 'Test Organizer',
      eventDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      eventTime: '18:00',
      location: 'Test Location',
      maxParticipants: 100,
      ticketPrice: 25.99,
      availableTickets: 50
    });
  });

  afterEach(async () => {
    await User.deleteMany({});
    await Event.deleteMany({});
    await Ticket.deleteMany({});
  });

  afterAll(async () => {
    await stopServer();
  });

  describe('POST /tickets', () => {
    it('should create a new ticket', async () => {
      const res = await request(app)
        .post('/tickets')
        .set('Cookie', [`token=${authToken}`])
        .send({
          eventId: testEvent._id,
          quantity: 2
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('_id');
      expect(res.body.quantity).toBe(2);
    });

    it('should fail with insufficient tickets', async () => {
      const res = await request(app)
        .post('/tickets')
        .set('Cookie', [`token=${authToken}`])
        .send({
          eventId: testEvent._id,
          quantity: 51
        });

      expect(res.status).toBe(400);
    });
  });

  describe('GET /tickets/user/:userId', () => {
    it('should return user tickets', async () => {
      await Ticket.create({
        userId: testUser._id,
        eventId: testEvent._id,
        quantity: 1,
        ticketDetails: {
          name: testUser.name,
          email: testUser.email,
          eventName: testEvent.title,
          eventDate: testEvent.eventDate,
          eventTime: testEvent.eventTime,
          ticketPrice: testEvent.ticketPrice,
          location: testEvent.location
        }
      });

      const res = await request(app)
        .get(`/tickets/user/${testUser._id}`)
        .set('Cookie', [`token=${authToken}`]);

      expect(res.status).toBe(200);
      expect(res.body.length).toBe(1);
    });
  });

  describe('DELETE /tickets/:ticketId', () => {
    it('should delete a ticket', async () => {
      const ticket = await Ticket.create({
        userId: testUser._id,
        eventId: testEvent._id,
        quantity: 1,
        ticketDetails: {
          name: testUser.name,
          email: testUser.email,
          eventName: testEvent.title,
          eventDate: testEvent.eventDate,
          eventTime: testEvent.eventTime,
          ticketPrice: testEvent.ticketPrice,
          location: testEvent.location
        }
      });

      const res = await request(app)
        .delete(`/tickets/${ticket._id}`)
        .set('Cookie', [`token=${authToken}`]);

      expect(res.status).toBe(200);
    });
  });
});