import EmberRouter from '@ember/routing/router';
import config from 'myapp/config/environment';

export default class Router extends EmberRouter {
  location = config.locationType;
  rootURL = config.rootURL;
}

Router.map(function () {
  this.route('login');
  this.route('projects');
  this.route('reviews');
  this.route('stats');
  this.route('account');
  this.route('teamwork/config');
  this.route('entry', { path: '/entries/:id' });
  this.route('not-found', { path: '/*path' });
});
