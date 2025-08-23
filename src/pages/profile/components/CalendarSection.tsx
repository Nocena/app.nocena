import React, { useState } from 'react';
import ThematicContainer from '../../../components/ui/ThematicContainer';

interface CalendarSectionProps {
  dailyChallenges: boolean[];
  weeklyChallenges: boolean[];
  monthlyChallenges: boolean[];
}

const CalendarSection: React.FC<CalendarSectionProps> = ({ dailyChallenges, weeklyChallenges, monthlyChallenges }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'year'>('month');

  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();

  const monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];

  // Navigate months
  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  // Navigate years
  const navigateYear = (direction: 'prev' | 'next') => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setFullYear(prev.getFullYear() - 1);
      } else {
        newDate.setFullYear(prev.getFullYear() + 1);
      }
      return newDate;
    });
  };

  // Generate calendar for current month
  const generateMonthCalendar = () => {
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const firstDayOfWeek = new Date(currentYear, currentMonth, 1).getDay();
    const startPadding = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1; // Monday as start

    // Calculate which day of year this month starts
    const startOfYear = new Date(currentYear, 0, 1);
    const startOfMonth = new Date(currentYear, currentMonth, 1);
    const daysSinceStartOfYear = Math.floor((startOfMonth.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24));

    // Get daily challenges for this month
    const dailyChallengesForMonth = dailyChallenges.slice(daysSinceStartOfYear, daysSinceStartOfYear + daysInMonth);

    // Calculate weeks for this month
    const weekStartIndex = Math.floor(daysSinceStartOfYear / 7);
    const weeksInMonth = Math.ceil((daysInMonth + startPadding) / 7);
    const weeklyChallengesForMonth = weeklyChallenges.slice(weekStartIndex, weekStartIndex + weeksInMonth);

    // Create calendar grid
    const calendarDays: Array<{
      day: number;
      isCurrentMonth: boolean;
      isDayCompleted: boolean;
      isToday: boolean;
      weekCompleted: boolean;
    }> = [];

    // Add previous month padding days
    const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const prevMonthDays = new Date(currentYear, prevMonth + 1, 0).getDate();
    for (let i = startPadding - 1; i >= 0; i--) {
      calendarDays.push({
        day: prevMonthDays - i,
        isCurrentMonth: false,
        isDayCompleted: false,
        isToday: false,
        weekCompleted: false,
      });
    }

    // Add current month days
    const today = new Date();
    const isCurrentMonthAndYear = currentMonth === today.getMonth() && currentYear === today.getFullYear();

    for (let day = 1; day <= daysInMonth; day++) {
      const weekIndex = Math.floor(calendarDays.length / 7);
      const isDayCompleted = day <= dailyChallengesForMonth.length && dailyChallengesForMonth[day - 1];
      const isToday = isCurrentMonthAndYear && day === today.getDate();
      const weekCompleted = weekIndex < weeklyChallengesForMonth.length && weeklyChallengesForMonth[weekIndex];

      calendarDays.push({
        day,
        isCurrentMonth: true,
        isDayCompleted,
        isToday,
        weekCompleted,
      });
    }

    // Add next month padding days to complete the grid (42 days = 6 weeks)
    const remainingDays = 42 - calendarDays.length;
    for (let day = 1; day <= remainingDays; day++) {
      calendarDays.push({
        day,
        isCurrentMonth: false,
        isDayCompleted: false,
        isToday: false,
        weekCompleted: false,
      });
    }

    return calendarDays;
  };

  const monthCompleted = monthlyChallenges[currentMonth] || false;

  if (viewMode === 'year') {
    return (
      <ThematicContainer asButton={false} glassmorphic={true} color="nocenaPink" rounded="xl" className="p-6">
        {/* Year View Header */}
        <div className="flex items-center justify-between mb-6">
          <ThematicContainer
            asButton={true}
            glassmorphic={true}
            color="nocenaBlue"
            rounded="lg"
            className="p-2"
            onClick={() => navigateYear('prev')}
          >
            ←
          </ThematicContainer>
          <h3 className="text-xl font-bold">{currentYear}</h3>
          <ThematicContainer
            asButton={true}
            glassmorphic={true}
            color="nocenaBlue"
            rounded="lg"
            className="p-2"
            onClick={() => navigateYear('next')}
          >
            →
          </ThematicContainer>
        </div>

        {/* Year Grid */}
        <div className="grid grid-cols-4 gap-3 mb-4">
          {monthNames.map((month, index) => (
            <ThematicContainer
              key={index}
              asButton={true}
              glassmorphic={true}
              color={monthlyChallenges[index] ? 'nocenaPurple' : 'nocenaBlue'}
              rounded="lg"
              className="p-3 text-center"
              isActive={monthlyChallenges[index]}
              onClick={() => {
                setCurrentDate(new Date(currentYear, index, 1));
                setViewMode('month');
              }}
            >
              <div className="text-sm font-medium">{month}</div>
              {monthlyChallenges[index] && <div className="text-lg mt-1">🏆</div>}
            </ThematicContainer>
          ))}
        </div>

        <ThematicContainer
          asButton={true}
          glassmorphic={true}
          color="nocenaPurple"
          rounded="lg"
          className="w-full py-2 text-sm"
          onClick={() => setViewMode('month')}
        >
          View Month Details
        </ThematicContainer>
      </ThematicContainer>
    );
  }

  // Month View
  const calendarDays = generateMonthCalendar();

  return (
    <ThematicContainer
      asButton={false}
      glassmorphic={true}
      color={monthCompleted ? 'nocenaPurple' : 'nocenaPink'}
      rounded="xl"
      className="overflow-hidden"
      isActive={monthCompleted}
    >
      {/* Month View Header */}
      <ThematicContainer
        asButton={false}
        glassmorphic={true}
        color="nocenaPurple"
        rounded="none"
        className="flex items-center justify-between p-4"
      >
        <ThematicContainer
          asButton={true}
          glassmorphic={false}
          color="nocenaPink"
          rounded="lg"
          className="p-2"
          onClick={() => navigateMonth('prev')}
        >
          ←
        </ThematicContainer>

        <div className="flex items-center space-x-4">
          <ThematicContainer
            asButton={true}
            glassmorphic={false}
            color="nocenaPurple"
            rounded="lg"
            className="text-lg font-bold px-3 py-1"
            onClick={() => setViewMode('year')}
          >
            {monthNames[currentMonth]} {currentYear}
          </ThematicContainer>
          {monthCompleted && <span className="text-xl">🏆</span>}
        </div>

        <ThematicContainer
          asButton={true}
          glassmorphic={false}
          color="nocenaPink"
          rounded="lg"
          className="p-2"
          onClick={() => navigateMonth('next')}
        >
          →
        </ThematicContainer>
      </ThematicContainer>

      {/* Calendar Grid */}
      <div className="p-4">
        {/* Day headers */}
        <div className="grid grid-cols-7 gap-1 mb-3">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, index) => (
            <div key={index} className="text-center text-sm font-medium text-white/60 py-2">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar days */}
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((dayData, index) => (
            <div key={index} className="relative">
              {dayData.isCurrentMonth && dayData.isDayCompleted ? (
                <ThematicContainer
                  asButton={false}
                  glassmorphic={true}
                  color="nocenaPurple"
                  rounded="lg"
                  className="aspect-square flex items-center justify-center text-sm font-medium relative"
                  isActive={true}
                >
                  <span className="relative z-10">{dayData.day}</span>
                  <div className="absolute top-1 right-1 w-2 h-2 bg-white rounded-full shadow-sm" />
                </ThematicContainer>
              ) : dayData.isCurrentMonth && dayData.isToday ? (
                <ThematicContainer
                  asButton={false}
                  glassmorphic={true}
                  color="nocenaBlue"
                  rounded="lg"
                  className="aspect-square flex items-center justify-center text-sm font-medium relative"
                  isActive={true}
                >
                  <span className="relative z-10">{dayData.day}</span>
                  <div className="absolute inset-0 border-2 border-blue-300 rounded-lg animate-pulse" />
                </ThematicContainer>
              ) : dayData.isCurrentMonth && dayData.weekCompleted ? (
                <ThematicContainer
                  asButton={false}
                  glassmorphic={true}
                  color="nocenaPink"
                  rounded="lg"
                  className="aspect-square flex items-center justify-center text-sm font-medium relative"
                >
                  <span className="relative z-10">{dayData.day}</span>
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-purple-400 rounded-b-lg" />
                </ThematicContainer>
              ) : (
                <div
                  className={`aspect-square rounded-lg flex items-center justify-center text-sm font-medium relative transition-all ${
                    !dayData.isCurrentMonth ? 'text-white/30' : 'text-white/70 hover:bg-white/10'
                  }`}
                >
                  <span className="relative z-10">{dayData.day}</span>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="mt-4 flex justify-center space-x-4 text-xs">
          <div className="flex items-center space-x-1">
            <ThematicContainer
              asButton={false}
              glassmorphic={true}
              color="nocenaPurple"
              rounded="sm"
              className="w-3 h-3"
              isActive={true}
            />
            <span className="text-white/70">Daily</span>
          </div>
          <div className="flex items-center space-x-1">
            <ThematicContainer
              asButton={false}
              glassmorphic={true}
              color="nocenaPink"
              rounded="sm"
              className="w-3 h-1"
            />
            <span className="text-white/70">Weekly</span>
          </div>
          <div className="flex items-center space-x-1">
            <span>🏆</span>
            <span className="text-white/70">Monthly</span>
          </div>
        </div>
      </div>
    </ThematicContainer>
  );
};

export default CalendarSection;
