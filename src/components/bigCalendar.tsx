"use client";

import { Calendar, momentLocalizer, View, Views } from "react-big-calendar";
import moment from "moment";
import { calendarEvents } from "@/lib/data";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { useState, useEffect } from "react";

const localizer = momentLocalizer(moment);

// Custom CSS to improve mobile responsiveness
import "./calendar-responsive.css";

const BigCalendar = ({
  data,
}: {
  data: { title: string; start: Date; end: Date }[];
}) => {
  const [view, setView] = useState<View>(Views.WORK_WEEK);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile devices and adjust view accordingly
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    // Set initial value
    handleResize();
    
    // Add event listener
    window.addEventListener("resize", handleResize);
    
    // Cleanup
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Automatically switch to day view on mobile
  useEffect(() => {
    if (isMobile) {
      setView(Views.DAY);
    }
  }, [isMobile]);

  const handleOnChangeView = (selectedView: View) => {
    setView(selectedView);
  };

  return (
    <div className="calendar-container">
      <Calendar
        localizer={localizer}
        events={data}
        startAccessor="start"
        endAccessor="end"
        views={isMobile ? ["work_week","day"] : ["work_week", "day"]}// Make changes here, make sure mobile users are only able to view day view not month view
        view={view}
        style={{ height: "100%" }}
        onView={handleOnChangeView}
        defaultDate={new Date()}
        min={new Date(0, 0, 0, 7, 0, 0)}
        max={new Date(0, 0, 0, 23, 0, 0)}
        toolbar={true}
        className="responsive-calendar"
      />
    </div>
  );
};

export default BigCalendar;
