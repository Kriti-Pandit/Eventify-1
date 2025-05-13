import { useEffect, useState, useContext } from 'react';
import axios from 'axios';
import { UserContext } from '../UserContext';
import { Link } from 'react-router-dom';
import videoBg from '../assets/videos/210824_small.mp4';
import { FaTrash, FaEdit } from 'react-icons/fa';

export default function MyEvents() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useContext(UserContext);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    if (user) {
      axios.get('/my-events', { withCredentials: true })
        .then(response => {
          setEvents(response.data);
          setLoading(false);
        })
        .catch(err => {
          console.error('Error fetching events:', err);
          setLoading(false);
        });
    }
  }, [user]);

  const handleDeleteEvent = async (eventId) => {
    if (!window.confirm('Are you sure you want to delete this event? This action cannot be undone.')) {
      return;
    }

    try {
      setIsDeleting(true);
      setDeletingId(eventId);
      await axios.delete(`/events/${eventId}`, { withCredentials: true });
      setEvents(events.filter(event => event._id !== eventId));
    } catch (err) {
      console.error('Error deleting event:', err);
      alert('Failed to delete event');
    } finally {
      setIsDeleting(false);
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="relative w-full min-h-screen overflow-hidden">
        <div className="absolute inset-0 z-0">
          <video 
            autoPlay 
            loop 
            muted 
            playsInline 
            className="w-full h-full object-cover"
          >
            <source src={videoBg} type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-black bg-opacity-30"></div>
        </div>
        <div className="relative z-10 flex items-center justify-center min-h-screen">
          <div className="text-center text-white">
            <div className="inline-block w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-4">Loading your events...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full min-h-screen overflow-hidden">
      {/* Video Background */}
      <div className="absolute inset-0 z-0">
        <video 
          autoPlay 
          loop 
          muted 
          playsInline 
          className="w-full h-full object-cover"
        >
          <source src={videoBg} type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-black bg-opacity-30"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 py-10 px-5 md:px-10 lg:px-32">
        <h1 className="text-3xl font-bold text-cyan-400 mb-8">My Events</h1>
        
        {events.length === 0 ? (
          <div className="bg-[#000033]/90 rounded-lg p-8 text-center">
            <p className="text-gray-300 text-lg">You haven't created any events yet.</p>
            <Link 
              to="/createEvent" 
              className="mt-4 inline-block px-6 py-2 bg-cyan-500 text-[#00004B] rounded-lg font-bold hover:bg-cyan-400 transition-colors"
            >
              Create Your First Event
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map(event => (
              <div key={event._id} className="bg-[#000033]/90 rounded-lg overflow-hidden shadow-lg hover:shadow-cyan-500/20 transition-all">
                <Link to={`/event/${event._id}`}>
                  {event.image ? (
                    <img 
                      src={`http://localhost:4000/${event.image}`} 
                      alt={event.title} 
                      className="w-full h-48 object-cover"
                    />
                  ) : (
                    <div className="w-full h-48 bg-[#000044] flex items-center justify-center">
                      <span className="text-gray-400">No image</span>
                    </div>
                  )}
                  <div className="p-4">
                    <h2 className="text-xl font-bold text-white mb-2">{event.title}</h2>
                    <p className="text-cyan-400 mb-2">
                      {event.ticketPrice === 0 ? 'Free' : `Rs ${event.ticketPrice}`}
                    </p>
                    <p className="text-gray-300 text-sm mb-2">
                      {new Date(event.eventDate).toLocaleDateString()} • {event.eventTime}
                    </p>
                    <p className="text-gray-300 text-sm">{event.location}</p>
                  </div>
                </Link>
                <div className="p-4 border-t border-cyan-500/20 flex justify-between items-center">
                  <Link 
                    to={`/event/${event._id}/registrations`}
                    className="text-cyan-400 hover:text-cyan-300 text-sm font-medium"
                  >
                    View Registrations →
                  </Link>
                  
                  <div className="flex gap-2">
                    <Link 
                      to={`/edit-event/${event._id}`}
                      className="text-cyan-400 hover:text-cyan-300 p-2"
                      title="Edit Event"
                    >
                      <FaEdit />
                    </Link>
                    
                    <button 
                      onClick={() => handleDeleteEvent(event._id)}
                      disabled={isDeleting && deletingId === event._id}
                      className="text-red-400 hover:text-red-300 p-2"
                      title="Delete Event"
                    >
                      {isDeleting && deletingId === event._id ? (
                        <div className="inline-block w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <FaTrash />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}