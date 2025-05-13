import { useContext, useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { UserContext } from '../UserContext';
import videoBg from '../assets/videos/210824_small.mp4';

export default function EventRegistrations() {
  const { id } = useParams();
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useContext(UserContext);
  const [eventDetails, setEventDetails] = useState(null);
  const navigate = useNavigate(); // Add useNavigate hook

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [registrationsRes, eventRes] = await Promise.all([
          axios.get(`/events/${id}/registrations`),
          axios.get(`/events/${id}`)
        ]);
        setRegistrations(registrationsRes.data);
        setEventDetails(eventRes.data);
        setLoading(false);
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to load data');
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

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
            <p className="mt-4 text-cyan-400">Loading registrations...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
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
          <div className="text-center text-cyan-400 bg-[#000033]/90 p-8 rounded-lg">
            {error}
            <button 
              onClick={() => navigate('/my-events')} // Changed to navigate to MyEvents
              className="mt-4 inline-block px-6 py-2 bg-cyan-500 text-[#00004B] rounded-lg font-bold hover:bg-cyan-400 transition-colors"
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
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-cyan-400">
            {eventDetails?.title || 'Event'} Registrations
          </h1>
          <button 
            onClick={() => navigate('/my-events')} // Changed to navigate to MyEvents
            className="px-4 py-2 bg-cyan-500 text-[#00004B] rounded-lg font-bold hover:bg-cyan-400 transition-colors"
          >
            ← Back to My Events
          </button>
        </div>

        {registrations.length === 0 ? (
          <div className="bg-[#000033]/90 rounded-lg p-8 text-center">
            <p className="text-cyan-300 text-lg">No registrations yet</p>
          </div>
        ) : (
          <div className="bg-[#000033]/90 rounded-lg border border-cyan-500/20 overflow-hidden shadow-lg">
            <div className="grid grid-cols-12 bg-[#00004B] text-cyan-400 p-4 font-semibold">
              <div className="col-span-5 md:col-span-4">Attendee</div>
              <div className="col-span-4 hidden md:block">Email</div>
              <div className="col-span-3 md:col-span-2 text-center">Tickets</div>
              <div className="col-span-4 md:col-span-2 text-right">Amount</div>
            </div>
            
            {registrations.map((ticket) => (
              <div 
                key={ticket._id} 
                className="grid grid-cols-12 p-4 border-b border-cyan-500/10 hover:bg-[#00004B] transition-colors"
              >
                <div className="col-span-5 md:col-span-4 text-cyan-300">
                  {ticket.userId?.name || 'Guest'}
                </div>
                <div className="col-span-4 hidden md:block text-cyan-300 truncate">
                  {ticket.userId?.email || 'N/A'}
                </div>
                <div className="col-span-3 md:col-span-2 text-center text-cyan-300">
                  {ticket.quantity}
                </div>
                <div className="col-span-4 md:col-span-2 text-right text-cyan-300">
                  Rs {(ticket.ticketDetails?.ticketPrice * ticket.quantity).toFixed(2)}
                </div>
              </div>
            ))}
            
            <div className="bg-[#00004B] p-4 text-right text-cyan-400 font-semibold">
              Total Registrations: {registrations.length}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}