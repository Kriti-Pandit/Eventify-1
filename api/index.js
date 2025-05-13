require('dotenv').config({ path: './.env' });

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const multer = require('multer');
const path = require('path');

// Initialize Express app
const app = express();

// Constants
const PORT = process.env.PORT || 4000;
const bcryptSalt = bcrypt.genSaltSync(10);
const jwtSecret = process.env.JWT_SECRET || 'fallback-secret-key';

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(cors({
  credentials: true,
  origin: process.env.CLIENT_URL || 'http://localhost:5173'
}));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// File upload configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Database connection
const connectDB = async () => {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error('MongoDB connection URI not found in environment variables');
    }
    
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('MongoDB connected successfully');
  } catch (err) {
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
  }
};

// Models
const User = require('./models/User');
const Ticket = require('./models/Ticket');

// Event Schema and Model
const eventSchema = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  organizedBy: { type: String, required: true },
  eventDate: { type: Date, required: true },
  eventTime: { type: String, required: true },
  location: { type: String, required: true },
  maxParticipants: { type: Number, required: true },
  currentParticipants: { type: Number, default: 0 },
  ticketPrice: { type: Number, required: true },
  availableTickets: { type: Number, required: true },
  image: { type: String },
  likes: { type: Number, default: 0 },
  comments: [{ type: String }],
  createdAt: { type: Date, default: Date.now }
});

const Event = mongoose.model('Event', eventSchema);

// Authentication Middleware
const authenticate = async (req, res, next) => {
  const token = req.cookies.token;
  if (!token) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    const decoded = jwt.verify(token, jwtSecret);
    req.user = await User.findById(decoded.id);
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Routes

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date() });
});

// Auth Routes
app.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ error: 'Email already in use' });
    }

    const user = await User.create({
      name,
      email,
      password: bcrypt.hashSync(password, bcryptSalt),
    });

    res.status(201).json(user);
  } catch (err) {
    res.status(500).json({ error: 'Registration failed' });
  }
});

app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user || !bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user._id }, jwtSecret, { expiresIn: '1d' });
    
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 86400000
    }).json({ id: user._id, name: user.name, email: user.email });
  } catch (err) {
    res.status(500).json({ error: 'Login failed' });
  }
});

app.post('/logout', (req, res) => {
  res.clearCookie('token').json({ message: 'Logged out successfully' });
});

app.get('/profile', authenticate, (req, res) => {
  res.json({ name: req.user.name, email: req.user.email, _id: req.user._id });
});

// Event Routes
app.post('/createEvent', authenticate, upload.single('image'), async (req, res) => {
  try {
    const eventData = {
      ...req.body,
      owner: req.user._id,
      image: req.file?.path
    };

    const event = await Event.create(eventData);
    res.status(201).json(event);
  } catch (err) {
    res.status(400).json({ error: 'Event creation failed' });
  }
});

app.get('/events', async (req, res) => {
  try {
    const events = await Event.find().populate('owner', 'name email');
    res.json(events);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

app.get('/events/:id', async (req, res) => {
  try {
    const event = await Event.findById(req.params.id).populate('owner', 'name email');
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }
    res.json(event);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch event' });
  }
});
/*
// Update Event Route
app.put('/events/:id', authenticate, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    if (event.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Unauthorized to edit this event' });
    }

    const updatedEvent = await Event.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    res.json(updatedEvent);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update event' });
  }
});
*/
// In your index.js, update the PUT endpoint:
app.put('/events/:id', authenticate, upload.single('image'), async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    if (event.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Unauthorized to edit this event' });
    }

    const updateData = {
      ...req.body,
      // Only update image if a new one was uploaded
      ...(req.file && { image: req.file.path })
    };

    const updatedEvent = await Event.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    res.json(updatedEvent);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update event' });
  }
});
// Get events created by the current user
app.get('/my-events', authenticate, async (req, res) => {
  try {
    const events = await Event.find({ owner: req.user._id })
                            .sort({ createdAt: -1 })
                            .populate('owner', 'name email');
    res.json(events);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch your events' });
  }
});

// Get event registrations (tickets) for an event
app.get('/events/:id/registrations', authenticate, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    // Verify the requesting user is the event owner
    if (event.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const tickets = await Ticket.find({ eventId: req.params.id })
                              .populate('userId', 'name email');
    res.json(tickets);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch registrations' });
  }
});

// Delete an event
app.delete('/events/:id', authenticate, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    // Verify the requesting user is the event owner
    if (event.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Unauthorized to delete this event' });
    }

    // Delete all tickets for this event first
    await Ticket.deleteMany({ eventId: req.params.id });

    // Then delete the event
    await Event.findByIdAndDelete(req.params.id);

    res.json({ message: 'Event deleted successfully' });
  } catch (err) {
    console.error('Error deleting event:', err);
    res.status(500).json({ error: 'Failed to delete event' });
  }
});
// Update User Profile
app.put('/users/:id', authenticate, async (req, res) => {
  try {
    // Verify the requesting user is updating their own profile
    if (req.params.id !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Unauthorized to update this profile' });
    }

    const { name, email } = req.body;
    
    if (!name || !email) {
      return res.status(400).json({ error: 'Name and email are required' });
    }

    // Check if email is being changed to one that already exists
    if (email !== req.user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(409).json({ error: 'Email already in use' });
      }
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { name, email },
      { new: true, runValidators: true }
    );

    res.json(updatedUser);
  } catch (err) {
    console.error('Error updating user:', err);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Ticket Routes
app.get('/tickets/user/:userId', authenticate, async (req, res) => {
  try {
    const tickets = await Ticket.find({ userId: req.params.userId })
                              .populate('eventId', 'title eventDate eventTime ticketPrice location');
    res.json(tickets);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch tickets' });
  }
});

app.post('/tickets', authenticate, async (req, res) => {
  try {
    const { eventId, quantity } = req.body;
    
    if (!eventId || !quantity) {
      return res.status(400).json({ error: 'Event ID and quantity are required' });
    }

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    if (event.availableTickets < quantity) {
      return res.status(400).json({ error: 'Not enough tickets available' });
    }

    const ticketData = {
      userId: req.user._id,
      eventId: event._id,
      quantity,
      ticketDetails: {
        name: req.user.name,
        email: req.user.email,
        eventName: event.title,
        eventDate: event.eventDate,
        eventTime: event.eventTime,
        ticketPrice: event.ticketPrice,
        location: event.location
      }
    };

    const ticket = await Ticket.create(ticketData);

    await Event.findByIdAndUpdate(eventId, {
      $inc: { 
        availableTickets: -quantity,
        currentParticipants: quantity
      }
    });

    res.status(201).json(ticket);
  } catch (err) {
    console.error('Ticket creation error:', err);
    res.status(500).json({ error: 'Ticket creation failed', details: err.message });
  }
});

app.delete('/tickets/:ticketId', authenticate, async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.ticketId);
    
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    if (ticket.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    await Event.findByIdAndUpdate(ticket.eventId, {
      $inc: { 
        availableTickets: +ticket.quantity,
        currentParticipants: -ticket.quantity
      }
    });

    await Ticket.findByIdAndDelete(req.params.ticketId);
    res.json({ message: 'Ticket deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete ticket' });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Start server
const startServer = async () => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  });
};

startServer();