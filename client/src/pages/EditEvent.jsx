import { useEffect, useState, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { UserContext } from '../UserContext';
import videoBg from '../assets/videos/210824_small.mp4';

export default function EditEvent() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(UserContext);
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    eventDate: '',
    eventTime: '',
    location: '',
    ticketPrice: 0,
    image: null
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!user) return;

    const fetchEvent = async () => {
      try {
        const response = await axios.get(`/events/${eventId}`, { 
          withCredentials: true 
        });
        
        if (response.data.owner._id !== user._id) {
          navigate('/my-events');
          return;
        }

        setEvent(response.data);
        setFormData({
          title: response.data.title,
          description: response.data.description,
          eventDate: new Date(response.data.eventDate).toISOString().split('T')[0],
          eventTime: response.data.eventTime,
          location: response.data.location,
          ticketPrice: response.data.ticketPrice,
          image: null
        });
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to load event');
      } finally {
        setLoading(false);
      }
    };

    fetchEvent();
  }, [user, eventId, navigate]);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === 'image') {
      setFormData(prev => ({ ...prev, image: files[0] }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(false);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('title', formData.title);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('eventDate', formData.eventDate);
      formDataToSend.append('eventTime', formData.eventTime);
      formDataToSend.append('location', formData.location);
      formDataToSend.append('ticketPrice', formData.ticketPrice.toString());
      
      if (formData.image) {
        formDataToSend.append('image', formData.image);
      }

      const response = await axios.put(`/events/${eventId}`, formDataToSend, {
        withCredentials: true,
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setSuccess(true);
      setEvent(response.data); // Update local event data with response
      
      // Show success message for 2 seconds before redirecting
      setTimeout(() => {
        navigate('/my-events');
      }, 2000);
    } catch (err) {
      console.error('Update error:', err.response?.data || err.message);
      setError(err.response?.data?.error || err.message || 'Failed to update event');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="relative w-full min-h-screen overflow-hidden">
        <div className="absolute inset-0 z-0">
          <video autoPlay loop muted playsInline className="w-full h-full object-cover">
            <source src={videoBg} type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-black bg-opacity-30"></div>
        </div>
        <div className="relative z-10 flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500"></div>
        </div>
      </div>
    );
  }

  if (error && !loading) {
    return (
      <div className="relative w-full min-h-screen overflow-hidden">
        <div className="absolute inset-0 z-0">
          <video autoPlay loop muted playsInline className="w-full h-full object-cover">
            <source src={videoBg} type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-black bg-opacity-30"></div>
        </div>
        <div className="relative z-10 flex items-center justify-center min-h-screen">
          <div className="bg-[#000033]/90 p-8 rounded-lg max-w-md text-center">
            <h2 className="text-2xl font-bold text-cyan-400 mb-4">Error</h2>
            <p className="text-red-400 mb-6">{error}</p>
            <button
              onClick={() => navigate('/my-events')}
              className="px-6 py-2 bg-cyan-500 text-[#00004B] rounded-lg font-bold hover:bg-cyan-400 transition-colors"
            >
              Back to My Events
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full min-h-screen overflow-hidden">
      <div className="absolute inset-0 z-0">
        <video autoPlay loop muted playsInline className="w-full h-full object-cover">
          <source src={videoBg} type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-black bg-opacity-30"></div>
      </div>

      <div className="relative z-10 py-10 px-5 md:px-10 lg:px-32">
        <h1 className="text-3xl font-bold text-cyan-400 mb-8">Edit Event</h1>
        
        {success && (
          <div className="bg-green-900/80 text-green-200 p-4 rounded-lg mb-6">
            Event updated successfully! Redirecting...
          </div>
        )}
        
        {error && (
          <div className="bg-red-900/80 text-red-200 p-4 rounded-lg mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-[#000033]/90 rounded-lg p-6 max-w-3xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="col-span-2">
              <label className="block text-gray-300 mb-2">Event Title</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-[#000044] text-white rounded-lg focus:ring-2 focus:ring-cyan-500"
                required
              />
            </div>

            <div className="col-span-2">
              <label className="block text-gray-300 mb-2">Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-[#000044] text-white rounded-lg focus:ring-2 focus:ring-cyan-500 h-32"
                required
              />
            </div>

            <div>
              <label className="block text-gray-300 mb-2">Date</label>
              <input
                type="date"
                name="eventDate"
                value={formData.eventDate}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-[#000044] text-white rounded-lg focus:ring-2 focus:ring-cyan-500"
                required
              />
            </div>

            <div>
              <label className="block text-gray-300 mb-2">Time</label>
              <input
                type="time"
                name="eventTime"
                value={formData.eventTime}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-[#000044] text-white rounded-lg focus:ring-2 focus:ring-cyan-500"
                required
              />
            </div>

            <div>
              <label className="block text-gray-300 mb-2">Location</label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-[#000044] text-white rounded-lg focus:ring-2 focus:ring-cyan-500"
                required
              />
            </div>

            <div>
              <label className="block text-gray-300 mb-2">Ticket Price (Rs)</label>
              <input
                type="number"
                name="ticketPrice"
                value={formData.ticketPrice}
                onChange={handleChange}
                min="0"
                step="0.01"
                className="w-full px-4 py-2 bg-[#000044] text-white rounded-lg focus:ring-2 focus:ring-cyan-500"
                required
              />
            </div>

            <div className="col-span-2">
              <label className="block text-gray-300 mb-2">Event Image (Leave empty to keep current)</label>
              <input
                type="file"
                name="image"
                onChange={handleChange}
                accept="image/*"
                className="w-full px-4 py-2 bg-[#000044] text-white rounded-lg focus:ring-2 focus:ring-cyan-500"
              />
              {event?.image && !formData.image && (
                <div className="mt-2">
                  <p className="text-gray-400 text-sm">Current Image:</p>
                  <img 
                    src={`http://localhost:4000/${event.image}`} 
                    alt="Current event" 
                    className="mt-2 h-32 object-contain"
                  />
                </div>
              )}
            </div>
          </div>

          <div className="mt-8 flex justify-end gap-4">
            <button
              type="button"
              onClick={() => navigate('/my-events')}
              className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-500 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 bg-cyan-500 text-[#00004B] rounded-lg font-bold hover:bg-cyan-400 transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Updating...' : 'Update Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}