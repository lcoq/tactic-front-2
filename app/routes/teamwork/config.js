import Route from '@ember/routing/route';
import { service } from '@ember/service';

export default class TeamworkConfigRoute extends Route {
  @service store;
  @service router;
  @service authentication;

  beforeModel() {
    if (this.authentication.notAuthenticated) {
      this.router.transitionTo('login');
    }
    const config = this.authentication.configs.findBy('id', 'teamwork');
    if (!config || !config.value) {
      this.router.transitionTo('account');
    }
  }

  model() {
    return this.store.query('teamwork/domain', {});
  }
}
