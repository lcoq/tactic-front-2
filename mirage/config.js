import { Response } from 'miragejs';
import { createServer } from 'miragejs';

import getEntries from './routes/get-entries';
import getStats from './routes/get-stats';

export default function (config) {
  // These comments are here to help you get started. Feel free to delete them.
  /*
    Config (with defaults).

    Note: these only affect routes defined *after* them!
  */
  // this.urlPrefix = '';    // make this `http://localhost:8080`, for example, if your API is on a different server
  // this.namespace = '';    // make this `/api`, for example, if your API is namespaced
  // this.timing = 400;      // delay for each request, automatically set to 0 during testing
  /*
    Shorthand cheatsheet:

    this.get('/posts');
    this.post('/posts');
    this.get('/posts/:id');
    this.put('/posts/:id'); // or this.patch
    this.del('/posts/:id');

    https://www.ember-cli-mirage.com/docs/route-handlers/shorthands
  */

  config.urlPrefix = 'http://localhost:3000';

  return createServer({
    ...config,
    routes,
    trackRequests: true,
  });
}

function routes() {
  this.get('/sessions', function (schema, request) {
    const authorization = request.requestHeaders['Authorization'];
    const session = schema.sessions.findBy({ token: authorization });
    if (session) {
      return session;
    } else {
      return new Response(422, {}, {});
    }
  });
  this.post('/sessions', function (schema /*, request*/) {
    let attrs = this.normalizedRequestAttrs();
    const user = schema.users.find(attrs.userId);
    if (user && user.password === attrs.password) {
      return schema.sessions.create({ user: user });
    } else {
      return new Response(422, {}, {});
    }
  });

  this.get('/users');
  this.get('/users/:id');
  this.patch('/users/:id');

  this.patch('/users/:userId/configs/:configId', function (schema, request) {
    const configId = request.params.configId;
    const attributes = this.normalizedRequestAttrs('user-config');
    return schema.userConfigs.find(configId).update(attributes);
  });

  this.get('/entries', getEntries.default());
  this.get('/entries/:id');
  this.post('/entries');
  this.patch('/entries/:id');
  this.delete('/entries/:id');

  this.get('/projects', (schema) => schema.projects.all().sort(sortByName));
  this.post('/projects');
  this.patch('/projects/:id');
  this.delete('/projects/:id');

  this.get('/clients', (schema) => schema.clients.all().sort(sortByName));
  this.post('/clients');
  this.patch('/clients/:id');
  this.delete('/clients/:id');

  this.get('/stats/daily', getStats.daily());
  this.get('/stats/monthly', getStats.monthly());

  this.get('/teamwork/domains', 'teamwork/domains');
  this.post('/teamwork/domains', 'teamwork/domains');
  this.patch('/teamwork/domains/:id', 'teamwork/domains');
  this.delete('/teamwork/domains/:id', 'teamwork/domains');

  this.get('/teamwork/configs', 'teamwork/user-configs');
  this.patch('/teamwork/configs/:id', 'teamwork/user-configs');

  this.get('/users/:user_id/notification_lists/latest', (schema) => {
    const list = schema.userNotificationLists.all().models[0];
    if (list) {
      return schema.userNotificationLists.find(list.id);
    } else {
      return schema.userNotificationLists.create({
        notifications: schema.userNotifications.all()
      });
    }
    return { data: null }
  });
  this.patch('/users/:user_id/notification_lists/:id', 'user-notification-lists');

  this.delete('/users/:user_id/notifications/:id', 'user-notifications');
}

function sortByName(a, b) {
  return a.name < b.name ? -1 : 1;
}
