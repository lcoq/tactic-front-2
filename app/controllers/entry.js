import Controller from '@ember/controller';
import { action } from '@ember/object';
import { service } from '@ember/service';
import { isEmpty } from '@ember/utils';
import { resolve } from 'rsvp';

export default class EntryController extends Controller {
  @service store;
  @service router;
  @service userSummary;

  get entry() {
    return this.model;
  }

  @action didUpdate() {
    this.userSummary.reload();
  }

  @action didDelete() {
    this.userSummary.reload();
    this.router.transitionTo('/');
  }

  @action searchProjects(query) {
    if (isEmpty(query)) {
      return resolve();
    }
    return this.store.query('project', { filter: { query: query } });
  }
}
