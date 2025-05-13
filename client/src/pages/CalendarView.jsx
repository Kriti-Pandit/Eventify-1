import axios from "axios";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, addMonths, isBefore, isToday } from "date-fns";
import { useEffect, useState } from "react";
import { BsCaretLeftFill, BsFillCaretRightFill } from "react-icons/bs";
import { Link } from "react-router-dom";

export default function CalendarView() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [hoveredDay, setHoveredDay] = useState(null);
  
  // Fetch events from the server
  useEffect(() => {
    axios.get("/events").then((response) => {
      const currentDate = new Date();
      const upcomingEvents = response.data.filter(event => {
        return !isBefore(new Date(event.eventDate), currentDate) || 
               isToday(new Date(event.eventDate));
      });
      setEvents(upcomingEvents);
    }).catch((error) => {
      console.error("Error fetching events:", error);
    });
  }, []);

  const firstDayOfMonth = startOfMonth(currentMonth);
  const lastDayOfMonth = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: firstDayOfMonth, end: lastDayOfMonth });

  const firstDayOfWeek = firstDayOfMonth.getDay();

  // Create an array of empty cells to align days correctly
  const emptyCells = Array.from({ length: firstDayOfWeek }, (_, index) => (
    <div key={`empty-${index}`} className="p-2 bg-[#1a1a2e]"></div>
  ));

  // Function to handle multiple events on the same day
  const renderEventsForDay = (date, dayEvents) => {
    if (dayEvents.length === 0) return null;
    
    const dateString = format(date, "yyyy-MM-dd");
    const isHovered = hoveredDay === dateString;
    const hasExtraEvents = dayEvents.length > 3;

    return (
      <>
        {/* Always show up to 3 events */}
        {dayEvents.slice(0, 3).map((event) => (
          <Link 
            key={event._id} 
            to={"/event/" + event._id} 
            className="block mt-1"
          >
            <div className="text-white bg-[#4cc9f0] rounded p-1 font-bold text-xs md:text-sm hover:bg-[#3a9fc7] transition-colors">
              {event.title}
            </div>
          </Link>
        ))}
        
        {/* Show "+ more" indicator if there are extra events */}
        {hasExtraEvents && (
          <div className="relative">
            <div 
              className="text-xs bg-[#16213e] text-[#4cc9f0] rounded p-1 mt-1 font-semibold cursor-default"
              onMouseEnter={() => setHoveredDay(dateString)}
              onMouseLeave={() => setHoveredDay(null)}
            >
              +{dayEvents.length - 3} more
            </div>
            
            {/* Hover card showing ALL events */}
            {isHovered && (
              <div className="absolute z-10 left-0 mt-1 w-48 bg-[#1a1a2e] border border-[#4cc9f0] rounded-lg shadow-lg p-2">
                <div className="text-[#4cc9f0] font-bold text-sm mb-1">
                  {format(date, "MMMM d")} - All Events
                </div>
                {dayEvents.map((event) => (
                  <Link 
                    key={event._id} 
                    to={"/event/" + event._id} 
                    className="block py-1 hover:bg-[#16213e] px-1 rounded"
                  >
                    <div className="text-white text-xs truncate">
                      {event.title}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}
      </>
    );
  };

  return (
    <div className="p-4 md:mx-16">
      <div className="rounded-lg p-4 bg-[#16213e] shadow-lg">
        <div className="flex items-center mb-4 justify-center gap-6">
          <button 
            className="text-[#4cc9f0] hover:text-[#3a9fc7] transition-colors"
            onClick={() => setCurrentMonth((prevMonth) => addMonths(prevMonth, -1))}
          >
            <BsCaretLeftFill className="w-auto h-6" />
          </button>
          <span className="text-xl font-semibold text-[#4cc9f0]">
            {format(currentMonth, "MMMM yyyy")}
          </span>
          <button 
            className="text-[#4cc9f0] hover:text-[#3a9fc7] transition-colors"
            onClick={() => setCurrentMonth((prevMonth) => addMonths(prevMonth, 1))}
          >
            <BsFillCaretRightFill className="w-auto h-6"/>
          </button>
        </div>
        
        <div className="grid grid-cols-7 text-center">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div key={day} className="p-2 font-semibold text-[#4cc9f0] bg-[#1a1a2e]">
              {day}
            </div>
          ))}
        </div>
        
        <div className="grid grid-cols-7">
          {emptyCells.concat(daysInMonth.map((date) => {
            const dayEvents = events.filter(
              (event) => format(new Date(event.eventDate), "yyyy-MM-dd") === format(date, "yyyy-MM-dd")
            );
            
            return (
              <div 
                key={date.toISOString()} 
                className={`p-2 relative top-0 pb-20 sm:pb-24 border border-[#1a1a2e] ${
                  isToday(date) ? "bg-[#0f3460]" : "bg-[#1a1a2e]"
                } flex flex-col items-start justify-start`}
                onMouseEnter={() => dayEvents.length > 3 && setHoveredDay(format(date, "yyyy-MM-dd"))}
                onMouseLeave={() => setHoveredDay(null)}
              >
                <div className={`font-bold ${
                  isToday(date) ? "text-[#4cc9f0]" : "text-white"
                }`}>
                  {format(date, "dd")}
                </div>
                <div className="absolute top-8 left-0 right-0 px-1">
                  {renderEventsForDay(date, dayEvents)}
                </div>
              </div>
            );
          }))}
        </div>
      </div>
    </div>
  );
}