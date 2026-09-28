/**
 * Converts a 24-hour time string (HH:mm) to a 12-hour format (hh:mm AM/PM).
 * @param {string} time24 - The time string in 24-hour format (e.g., "14:30" or "09:15").
 * @returns {string} The time string in 12-hour format (e.g., "02:30 PM" or "09:15 AM").
 */
export const formatTo12Hr = (time24) => {
  if (!time24 || time24 === '--' || typeof time24 !== 'string') return time24;
  
  const [hoursStr, minutesStr] = time24.split(':');
  if (!hoursStr || !minutesStr) return time24;

  let hours = parseInt(hoursStr, 10);
  const minutes = minutesStr;
  const ampm = hours >= 12 ? 'PM' : 'AM';
  
  hours = hours % 12;
  hours = hours ? hours : 12; // the hour '0' should be '12'
  
  const strHours = hours < 10 ? `0${hours}` : hours;
  
  return `${strHours}:${minutes} ${ampm}`;
};

/**
 * Formats a range of 24-hour time strings (e.g., "13:00-14:00") to 12-hour format.
 * @param {string} rangeStr - The time range string (e.g., "13:00-14:00").
 * @returns {string} The formatted range string (e.g., "01:00 PM - 02:00 PM").
 */
export const formatRangeTo12Hr = (rangeStr) => {
  if (!rangeStr || typeof rangeStr !== 'string' || !rangeStr.includes('-')) return rangeStr;
  
  return rangeStr
    .split('-')
    .map(time => formatTo12Hr(time.trim()))
    .join(' - ');
};
