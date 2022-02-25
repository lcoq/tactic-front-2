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
    moment(this.startedAt).add(randHour, 'h').add(randMin, 'm').toDate();
  },

  withoutTitle: trait({
    title() {
      return null;
    },
  }),

  running: trait({
    stoppedAt() {
      return null;
    }
  })
});
