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
      eventDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
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
      expect(res.body.ticketDetails.eventName).toBe('Test Event');

      // Verify event ticket count was updated
      const updatedEvent = await Event.findById(testEvent._id);
      expect(updatedEvent.availableTickets).toBe(48);
      expect(updatedEvent.currentParticipants).toBe(2);
    });

    it('should fail with insufficient available tickets', async () => {
      const res = await request(app)
        .post('/tickets')
        .set('Cookie', [`token=${authToken}`])
        .send({
          eventId: testEvent._id,
          quantity: 51
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Not enough tickets available');
    });

    it('should fail with invalid quantity', async () => {
      const res = await request(app)
        .post('/tickets')
        .set('Cookie', [`token=${authToken}`])
        .send({
          eventId: testEvent._id,
          quantity: 0
        });

      expect(res.status).toBe(400);
    });

    it('should fail for non-existent event', async () => {
      const fakeEventId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .post('/tickets')
        .set('Cookie', [`token=${authToken}`])
        .send({
          eventId: fakeEventId,
          quantity: 1
        });

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Event not found');
    });

    it('should fail when unauthenticated', async () => {
      const res = await request(app)
        .post('/tickets')
        .send({
          eventId: testEvent._id,
          quantity: 1
        });

      expect(res.status).toBe(401);
    });
  });

  describe('GET /tickets/user/:userId', () => {
    it('should return user tickets', async () => {
      // Create a ticket first
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
      expect(res.body[0].ticketDetails.eventName).toBe('Test Event');
    });

    it('should fail when requesting other user tickets', async () => {
      const otherUser = await User.create({
        name: 'Other User',
        email: 'other@test.com',
        password: bcrypt.hashSync('password123', 10)
      });

      const res = await request(app)
        .get(`/tickets/user/${otherUser._id}`)
        .set('Cookie', [`token=${authToken}`]);

      expect(res.status).toBe(403);
    });

    it('should fail when unauthenticated', async () => {
      const res = await request(app)
        .get(`/tickets/user/${testUser._id}`);

      expect(res.status).toBe(401);
    });
  });

  describe('DELETE /tickets/:ticketId', () => {
    let testTicket;

    beforeEach(async () => {
      testTicket = await Ticket.create({
        userId: testUser._id,
        eventId: testEvent._id,
        quantity: 2,
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

      // Update event counts
      await Event.findByIdAndUpdate(testEvent._id, {
        $inc: { 
          availableTickets: -2,
          currentParticipants: 2
        }
      });
    });

    it('should delete a ticket and update event counts', async () => {
      const res = await request(app)
        .delete(`/tickets/${testTicket._id}`)
        .set('Cookie', [`token=${authToken}`]);

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Ticket deleted successfully');

      // Verify ticket was deleted
      const deletedTicket = await Ticket.findById(testTicket._id);
      expect(deletedTicket).toBeNull();

      // Verify event counts were updated
      const updatedEvent = await Event.findById(testEvent._id);
      expect(updatedEvent.availableTickets).toBe(50);
      expect(updatedEvent.currentParticipants).toBe(0);
    });

    it('should fail when deleting other user ticket', async () => {
      const otherUser = await User.create({
        name: 'Other User',
        email: 'other@test.com',
        password: bcrypt.hashSync('password123', 10)
      });

      const otherTicket = await Ticket.create({
        userId: otherUser._id,
        eventId: testEvent._id,
        quantity: 1,
        ticketDetails: {
          name: otherUser.name,
          email: otherUser.email,
          eventName: testEvent.title,
          eventDate: testEvent.eventDate,
          eventTime: testEvent.eventTime,
          ticketPrice: testEvent.ticketPrice,
          location: testEvent.location
        }
      });

      const res = await request(app)
        .delete(`/tickets/${otherTicket._id}`)
        .set('Cookie', [`token=${authToken}`]);

      expect(res.status).toBe(403);
    });

    it('should fail for non-existent ticket', async () => {
      const fakeTicketId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .delete(`/tickets/${fakeTicketId}`)
        .set('Cookie', [`token=${authToken}`]);

      expect(res.status).toBe(404);
    });

    it('should fail when unauthenticated', async () => {
      const res = await request(app)
        .delete(`/tickets/${testTicket._id}`);

      expect(res.status).toBe(401);
    });
  });
});