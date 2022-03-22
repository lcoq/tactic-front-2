import { Factory } from 'miragejs';
import { faker } from '@faker-js/faker';

export default Factory.extend({
  title() {
    return faker.lorem.sentence;
  },
  message() {
    return faker.lorem.paragraph;
  },
  nature() {
    return 'info';
  },
  status() {
    return 'unread';
  },
  createdAt() {
    return new Date();
  },
});
