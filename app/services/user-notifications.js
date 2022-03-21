import Service, { service } from '@ember/service';
import { action } from '@ember/object';
import { tracked } from '@glimmer/tracking';

export default class UserNotificationsService extends Service {
  @service store;
  @service authentication;

  @tracked list = null;
  @tracked notifications = [];

  get hasUnread() {
    return this.notifications.isAny('isUnread');
  }

  @action async reload() {
    this.list = await this.store.queryRecord('user-notification-list', {
      include: 'notifications,notifications.resource'
    });
    this.notifications = await this.list.notifications;
  }

  @action async markRead() {
    this.list.status = 'read';
    this.list.save();
  }

  constructor() {
    super(...arguments);
    if (this.authentication.isAuthenticated) {
      this.reload();
    }
    this.authentication.eventEmitter.on('authenticated', this.reload, this);
  }
}
