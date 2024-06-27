const seconds = 1;
const minutes = 60 * seconds;
const hours = 60 * minutes;
const days = 24 * hours;
const weeks = 7 * days;
const months = 30 * days;
const years = 52 * weeks;

export const MILLISECONDS = 1000 as const;

export const TIME_IN_SECONDS = {
  s: seconds,
  sec: seconds,
  secs: seconds,
  second: seconds,
  seconds,
  m: minutes,
  min: minutes,
  mins: minutes,
  minute: minutes,
  minutes,
  h: hours,
  hr: hours,
  hrs: hours,
  hour: hours,
  hours,
  d: days,
  day: days,
  days,
  week: weeks,
  month: months,
  months,
  y: years,
  yr: years,
  yrs: years,
  year: years,
  years,
} as const;
