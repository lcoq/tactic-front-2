import { helper } from '@ember/component/helper';
import moment from 'moment';

export default helper(function entryGroupDayHelper(positional /*, named*/) {
  const [rawDay] = positional;
  const day = moment(rawDay).hours(0).minutes(0).seconds(0);
  const today = moment().hours(0).minutes(0).seconds(0);
  const yesterday = moment(today.toDate()).subtract(1, 'day');

  if (day.isAfter(today, 'day')) {
    if (day.isSame(today, 'year')) {
      return day.format('ddd[,] D MMM');
    } else {
      return day.format('ddd[,] D MMM YYYY');
    }
  }

  if (day.isSame(today, 'day')) {
    return 'Today';
  }
  if (day.isSame(yesterday, 'day')) {
    return 'Yesterday';
  }
  if (day.isSame(today, 'year')) {
    return day.format('ddd[,] D MMM');
  }

  return day.format('ddd[,] D MMM YYYY');
});
