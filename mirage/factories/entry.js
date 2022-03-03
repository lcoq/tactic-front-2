import { Factory, trait } from 'miragejs';
import { faker } from '@faker-js/faker';
import moment from 'moment';

const threeMonthAgo = moment().startOf('month').subtract(3, 'month').toDate();
const yesterday = moment().endOf('day').subtract(1, 'day').toDate();

const maxHourDiff = 4;
const maxMinDiff = 60;

export default Factory.extend({
  title() {
    return faker.git.commitMessage();
  },

  startedAt() {
    return faker.date.between(threeMonthAgo, yesterday);
  },

  stoppedAt() {
    const randHour = Math.floor(Math.random() * maxHourDiff + 1);
    const randMin = Math.floor(Math.random() * maxMinDiff + 1);
    return moment(this.startedAt).add(randHour, 'h').add(randMin, 'm').toDate();
  },

  roundedDuration() {
    if (!this.startedAt || !this.stoppedAt) return;
    const duration = moment(this.stoppedAt).diff(this.startedAt, 'seconds');
    const minutes = Math.floor(duration / 60.0);
    const roundToMinutes = 5;
    let roundedMinutes = minutes;
    if (minutes % roundToMinutes !== 0) {
      roundedMinutes += roundToMinutes - (minutes % roundToMinutes);
    }
    return roundedMinutes * 60;
  },

  withoutTitle: trait({
    title() {
      return null;
    },
  }),

  running: trait({
    stoppedAt() {
      return null;
    },
  }),
});
