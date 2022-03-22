import Component from '@glimmer/component';

export default class NotificationListComponent extends Component {
  get notifications() {
    return this.args.notifications;
  }

  get hasNotification() {
    return this.notifications.length > 0;
  }
}
