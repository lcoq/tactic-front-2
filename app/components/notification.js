import Component from '@glimmer/component';
import { action } from '@ember/object';

export default class NotificationComponent extends Component {
  get notif() {
    return this.args.notif;
  }

  get nature() {
    return this.notif.nature;
  }

  get isUnread() {
    return this.notif.isUnread;
  }

  get classes() {
    const classes = [
      `notif__item`,
      `notif__item--${this.nature}`
    ];
    if (this.isUnread) {
      classes.push(`notif__item--new`);
    }
    return classes.join(' ');
  }

  @action async onResourceClick() {
    const resource = await this.notif.resource;
    this.args.onResourceClick(resource);
  }
}
