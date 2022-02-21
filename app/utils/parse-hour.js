export default function parseHour(string) {
  const [ hoursString, minutesString ] = string.split(':');
  const hours = parseInt(hoursString);
  const minutes = parseInt(minutesString || '0');
  return [ hours, minutes ];
}
