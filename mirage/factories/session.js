import { Factory } from 'miragejs';
import { faker } from '@faker-js/faker';

export default Factory.extend({
  token() {
    return faker.unique(faker.datatype.uuid);
  },
});
