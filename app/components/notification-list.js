import Component from '@glimmer/component';
import { service } from '@ember/service';
import { action } from '@ember/object';

export default class NotificationListComponent extends Component {

  get notifications() {
    return this.args.notifications;
  }

  get hasNotification() {
    return this.notifications.length > 0;
  }
}
