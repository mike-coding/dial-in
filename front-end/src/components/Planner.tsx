import React, { useState } from 'react';
import PlannerCalendar from './PlannerCalendar';
import PlannerTasks from './PlannerTasks';

interface PlannerProps {
  isMobile?: boolean;
}

const Planner: React.FC<PlannerProps> = ({ isMobile = false }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  return (
    <div className={`flex w-full max-w-none flex-col gap-6 ${isMobile ? 'px-2' : ''}`}>
      <section className="min-h-[32rem] w-full">
        <PlannerCalendar
          currentDate={currentDate}
          isMobile={false}
          selectedDate={selectedDate}
          setCurrentDate={setCurrentDate}
          setSelectedDate={setSelectedDate}
        />
      </section>

      <section className="w-full">
        <PlannerTasks currentDate={currentDate} isMobile={isMobile} selectedDate={selectedDate} />
      </section>
    </div>
  );
};

export default Planner;
