import Component from '@glimmer/component';
import { action } from '@ember/object';
import { htmlSafe } from '@ember/template';

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
    const classes = [`notif__item`, `notif__item--${this.nature}`];
    if (this.isUnread) {
      classes.push(`notif__item--new`);
    }
    return classes.join(' ');
  }

  get formattedMessage() {
    if (!this.notif.message) return null;
    const formatted = this.notif.message
      .replace(/\r?\n/g, '<br>')
      .replace(
        this._urlRegexp,
        '<a class="notif__description-link" href="$1" target="_blank">$1</a>'
      );
    return htmlSafe(formatted);
  }

  @action async onResourceClick() {
    const resource = await this.notif.resource;
    this.args.onResourceClick(resource);
  }

  get _urlRegexp() {
    /* eslint-disable no-useless-escape */
    return /((([A-Za-z]{3,9}:(?:\/\/)?)(?:[\-;:&=\+\$,\w]+@)?[A-Za-z0-9\.\-]+|(?:www\.|[\-;:&=\+\$,\w]+@)[A-Za-z0-9\.\-]+)((?:\/[\+~%\/\.\w\-_]*)?\??(?:[\-\+=&;%@\.\w_]*)#?(?:[\.\!\/\\\w]*))?)/g;
  }
}
