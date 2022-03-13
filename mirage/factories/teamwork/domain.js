import { Factory } from 'miragejs';
import { faker } from '@faker-js/faker';

export default Factory.extend({
  name() {
    return faker.unique(faker.internet.domainWord);
  },

  alias() {
    return this.name.slice(0, 4);
  },

  token() {
    return faker.datatype.uuid();
  },
});
