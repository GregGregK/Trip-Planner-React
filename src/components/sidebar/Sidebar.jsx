// src/components/sidebar/Sidebar.jsx
import Calendar from './Calendar'
import DaysList from './DaysList'

export default function Sidebar() {
  return (
    <>
      <div className="calendar">
        <div className="cal-nav" id="calNav">
          <Calendar />
        </div>
      </div>
      <div className="days-list">
        <div className="days-list-title">Dias planejados</div>
        <DaysList />
      </div>
    </>
  )
}