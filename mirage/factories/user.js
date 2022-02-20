import { Factory } from 'miragejs';
import { faker } from '@faker-js/faker';

export default Factory.extend({
  name() {
    return faker.unique(faker.name.findName);
  },

  password() {
    return faker.internet.password();
  },
});
