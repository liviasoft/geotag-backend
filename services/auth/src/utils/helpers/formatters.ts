import { isValidDate } from '@neoncoder/validator-utils';

export type TDateFormatOptions = {
  dateLike: string;
  locales?: Intl.LocalesArgument;
  options?: Intl.DateTimeFormatOptions;
};

export const dateFormatter = ({
  dateLike,
  locales = ['en-US'],
  options = {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    month: 'short',
    day: '2-digit',
    weekday: 'short',
  },
}: TDateFormatOptions) => {
  if (!isValidDate(dateLike)) return null;
  return new Date(dateLike).toLocaleDateString(locales, options);
};

export const timeDifferenceInSeconds = (startDate: string, endDate = new Date()) => {
  if (!isValidDate(startDate) || !isValidDate(endDate as unknown as string)) return null;
  return new Date(startDate).getTime() - new Date(endDate).getTime();
};

export type TTimeFormatOptions = {
  wk?: string | null;
  d?: string | null;
  hr?: string | null;
  min?: string | null;
  sec?: string | null;
};

export const timeFormatHHMMSS = (
  timeDifference: number,
  { wk = 'wk', d = 'day', hr = 'hr', min = 'm', sec = 's' }: TTimeFormatOptions,
) => {
  if (timeDifference <= 0) {
    return '00:00';
  }
  // const { d, hr, min, sec, wk } = timeFormatOptions;
  const time = timeDifference / 1000;
  const weeks = Math.floor(time / (86400 * 7));
  const days = wk ? Math.floor(time / 86400) % 7 : Math.floor(time / 86400);
  const hours = d ? Math.floor(time / 3600) % 24 : Math.floor(time / 3600);
  const minutes = hr ? Math.floor(time / 60) % 60 : Math.floor(time / 60);
  const seconds = min ? Math.floor(time) % 60 : Math.floor(time);
  console.log(weeks && wk);
  const timeString = [
    weeks && wk ? ` ${weeks}${wk}${weeks > 1 ? 's' : ''}` : null,
    days && d ? ` ${days}${d}${days > 1 ? 's' : ''}` : null,
    hours && hr ? ` ${hours}${hr}${hours > 1 ? 's' : ''}` : null,
    minutes && min ? ` ${minutes >= 10 ? '' : '0'}${minutes}${min}` : `${min ? '00' : ''}`,
    seconds && sec ? ` ${seconds >= 10 ? '' : '0'}${seconds}${sec}` : `${sec ? '00' : ''}`,
  ]
    .filter(Boolean)
    .join('');
  return timeString;
};
