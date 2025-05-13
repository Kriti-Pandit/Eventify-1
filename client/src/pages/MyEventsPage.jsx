import { useContext, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { UserContext } from '../UserContext';

export default function MyEventsPage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useContext(UserContext);

  useEffect(() => {
    if (user) {
      axios.get(`/events/by-owner/${user._id}`)
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

  if (loading) {
    return (
      <div className="text-center py-8 text-cyan-400">
        Loading your events...
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-2xl font-bold text-cyan-400 mb-6">My Events</h1>
      
      {events.length === 0 ? (
        <div className="text-cyan-300 text-center py-8">
          You haven't created any events yet.
          <Link to="/createEvent" className="block mt-4 text-cyan-400 hover:underline">
            Create your first event
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {events.map(event => (
            <div key={event._id} className="bg-[#000033] rounded-lg border border-cyan-500/20 p-4 hover:bg-[#00004B] transition-colors">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-xl font-semibold text-cyan-300">{event.title}</h2>
                  <p className="text-cyan-400 text-sm mt-1">
                    {new Date(event.eventDate).toLocaleDateString()} • {event.eventTime}
                  </p>
                  <p className="text-cyan-300 mt-2">{event.location}</p>
                </div>
                <div className="flex gap-2">
                  <Link 
                    to={`/event/${event._id}/registrations`}
                    className="px-3 py-1 bg-cyan-600 text-white rounded text-sm hover:bg-cyan-500"
                  >
                    View Registrations
                  </Link>
                  <Link 
                    to={`/event/${event._id}`}
                    className="px-3 py-1 border border-cyan-500 text-cyan-300 rounded text-sm hover:bg-[#00004B]"
                  >
                    View Event
                  </Link>
                </div>
              </div>
              <div className="mt-3 text-cyan-400 text-sm">
                {event.currentParticipants} / {event.maxParticipants} attendees
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}