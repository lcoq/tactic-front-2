import ApplicationAdapter from './application';
import { service } from '@ember/service';

export default class UserNotificationListAdapter extends ApplicationAdapter {
  @service authentication;

  urlForQueryRecord(query, modelName) {
    if (this.authentication.user) {
      const userId = this.authentication.user.id;
      return `${this.host}/users/${userId}/notification_lists/latest`;
    } else {
      return super.urlForQueryRecord(...arguments);
    }
  }

  urlForUpdateRecord(id, modelName, snapshot) {
    if (this.authentication.user) {
      const userId = this.authentication.user.id;
      return `${this.host}/users/${userId}/notification_lists/${id}`;
    } else {
      return super.urlForUpdateRecord(...arguments);
    }
  }
}
