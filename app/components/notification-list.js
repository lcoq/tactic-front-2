import Component from '@glimmer/component';
import { service } from '@ember/service';
import { action } from '@ember/object';

export default class NotificationListComponent extends Component {
  @service store;
  @service router;
  @service filters;

  get notifications() {
    return this.args.notifications;
  }

  get hasNotification() {
    return this.notifications.length > 0;
  }

  @action async showEntry(id) {
    // TODO the entry should be loaded from the server UserNotification
    const entry = await this.store.findRecord('entry', id, { reload: true });
    this.router.transitionTo('entry', entry).then(() => this.args.close());
  }
}
