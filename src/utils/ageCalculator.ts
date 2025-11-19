/**
 * Calculate age from date of birth
 * @param dateOfBirth ISO date string (YYYY-MM-DD) or Date object
 * @returns Age in years, or null if date is invalid
 */
export function calculateAge(dateOfBirth: string | Date | null | undefined): number | null {
  if (!dateOfBirth) {
    return null;
  }

  let birthDate: Date;
  
  if (typeof dateOfBirth === 'string') {
    birthDate = new Date(dateOfBirth);
  } else {
    birthDate = dateOfBirth;
  }

  // Check if date is valid
  if (isNaN(birthDate.getTime())) {
    return null;
  }

  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  // Adjust age if birthday hasn't occurred this year
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }

  return age;
}

/**
 * Format date for input field (YYYY-MM-DD)
 */
export function formatDateForInput(date: string | Date | null | undefined): string {
  if (!date) {
    return '';
  }

  let dateObj: Date;
  if (typeof date === 'string') {
    dateObj = new Date(date);
  } else {
    dateObj = date;
  }

  if (isNaN(dateObj.getTime())) {
    return '';
  }

  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

/**
 * Calculate age at a specific event date
 * @param eventDate The date of the event (ISO string or Date)
 * @param dateOfBirth The person's date of birth (ISO string or Date)
 * @returns Age in years at the event date, or null if dates are invalid
 */
export function calculateAgeAtDate(
  eventDate: string | Date | null | undefined,
  dateOfBirth: string | Date | null | undefined
): number | null {
  if (!eventDate || !dateOfBirth) {
    return null;
  }

  let eventDateObj: Date;
  let birthDateObj: Date;

  if (typeof eventDate === 'string') {
    eventDateObj = new Date(eventDate);
  } else {
    eventDateObj = eventDate;
  }

  if (typeof dateOfBirth === 'string') {
    birthDateObj = new Date(dateOfBirth);
  } else {
    birthDateObj = dateOfBirth;
  }

  // Check if dates are valid
  if (isNaN(eventDateObj.getTime()) || isNaN(birthDateObj.getTime())) {
    return null;
  }

  let age = eventDateObj.getFullYear() - birthDateObj.getFullYear();
  const monthDiff = eventDateObj.getMonth() - birthDateObj.getMonth();

  // Adjust age if birthday hasn't occurred yet in the event year
  if (monthDiff < 0 || (monthDiff === 0 && eventDateObj.getDate() < birthDateObj.getDate())) {
    age--;
  }

  return age;
}

/**
 * Calculate the number of months between two dates
 * @param startDate Start date (ISO string or Date)
 * @param endDate End date (ISO string or Date)
 * @returns Number of months between the dates, or null if dates are invalid
 */
export function calculateMonthsDiff(
  startDate: string | Date | null | undefined,
  endDate: string | Date | null | undefined
): number | null {
  if (!startDate || !endDate) {
    return null;
  }

  let startDateObj: Date;
  let endDateObj: Date;

  if (typeof startDate === 'string') {
    startDateObj = new Date(startDate);
  } else {
    startDateObj = startDate;
  }

  if (typeof endDate === 'string') {
    endDateObj = new Date(endDate);
  } else {
    endDateObj = endDate;
  }

  // Check if dates are valid
  if (isNaN(startDateObj.getTime()) || isNaN(endDateObj.getTime())) {
    return null;
  }

  const yearDiff = endDateObj.getFullYear() - startDateObj.getFullYear();
  const monthDiff = endDateObj.getMonth() - startDateObj.getMonth();
  const dayDiff = endDateObj.getDate() - startDateObj.getDate();

  let totalMonths = yearDiff * 12 + monthDiff;

  // Adjust for partial months
  if (dayDiff < 0) {
    totalMonths--;
  }

  return totalMonths;
}

