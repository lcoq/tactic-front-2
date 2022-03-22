import { Factory, trait } from 'miragejs';
import { faker } from '@faker-js/faker';

export default Factory.extend({
  name() {
    return faker.unique(faker.name.findName);
  },

  password() {
    return faker.internet.password();
  },

  withTeamwork: trait({
    afterCreate(user, server) {
      server.create('user-config', {
        user,
        id: 'teamwork',
        name: 'teamwork',
        type: 'boolean',
        description: 'Teamwork integration',
        value: true,
      });
    },
  }),
});
