import moment from 'moment';

function pad(value, size) {
  let string = value.toFixed(0);
  while (string.length < size) {
    string = '0' + string;
  }
  return string;
}

export default function formatDuration() {
  let hours;
  let minutes;
  let seconds;

  if (arguments.length === 2) {
    const [startedAt, stoppedAt] = arguments;
    if (!startedAt || !stoppedAt) {
      return;
    }
    hours = moment(stoppedAt).diff(startedAt, 'hours');
    minutes = moment(stoppedAt).diff(startedAt, 'minutes') % 60;
    seconds = moment(stoppedAt).diff(startedAt, 'seconds') % 60;
  } else {
    const [durationInSeconds] = arguments;
    if (!durationInSeconds && durationInSeconds !== 0) {
      return;
    }
    hours = Math.floor(durationInSeconds / (60 * 60));
    minutes = Math.floor((durationInSeconds / 60) % 60);
    seconds = Math.floor(durationInSeconds % 60);
  }

  return [pad(hours, 2), pad(minutes, 2), pad(seconds, 2)].join(':');
}
