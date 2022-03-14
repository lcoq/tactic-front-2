import Controller from '@ember/controller';
import { action } from '@ember/object';
import { service } from '@ember/service';

export default class TeamworkConfigController extends Controller {
  @service store;
  @service authentication;

  get domains() {
    return this.model;
  }

  @action buildDomain() {
    const domain = this.store.createRecord('teamwork/domain', {
      user: this.authentication.user,
    });
    domain.stateManager.send('edit');
    this.domains.pushObject(domain);
  }

  @action revertDomain(domain) {
    domain.stateManager.send('clear');
    if (domain.isDeleted) {
      this.domains.removeObject(domain);
    }
  }

  @action didDeleteDomain(domain) {
    this.domains.removeObject(domain);
  }
}
