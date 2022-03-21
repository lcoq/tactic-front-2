import Controller from '@ember/controller';
import { service } from '@ember/service';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';
import { run } from '@ember/runloop';

import EntryModel from '../models/entry';

export default class ApplicationController extends Controller {
  @service authentication;
  @service userSummary;
  @service runningEntry;
  @service userNotifications;
  @service router;

  @tracked showNotifications = false;

  get isAuthenticated() {
    return this.authentication.isAuthenticated;
  }

  get currentUserName() {
    return this.authentication.userName;
  }

  get weekEntries() {
    return this.userSummary.weekEntries;
  }

  get monthEntries() {
    return this.userSummary.monthEntries;
  }

  get hasRunningEntry() {
    return this.runningEntry.isStarted;
  }

  get summaryRounding() {
    const config = this.authentication.configs.findBy('id', 'summary-rounding');
    return (config && config.value) || false;
  }

  get notifications() {
    return this.userNotifications.notifications;
  }

  get hasUnreadNotification() {
    return this.userNotifications.hasUnread;
  }

  @action toggleNotifications() {
    run(() => {
      this.showNotifications = !this.showNotifications;
      if (!this.showNotifications) {
        this.userNotifications.markRead();
      }
    });
  }

  @action onNotificationResourceClick(resource) {
    if (resource instanceof EntryModel) {
      this.router.transitionTo('entry', resource)
        .then(() => this.toggleNotifications());
    }
  }

  @action deleteNotification(notification) {
    notification.destroyRecord();
  }
}
