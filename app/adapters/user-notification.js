import ApplicationAdapter from './application';
import { service } from '@ember/service';

export default class UserNotificationAdapter extends ApplicationAdapter {
  @service authentication;

  urlForDeleteRecord(id, modelName, snapshot) {
    if (this.authentication.user) {
      const userId = this.authentication.user.id;
      return `${this.host}/users/${userId}/notifications/${id}`;
    } else {
      return super.urlForDeleteRecord(...arguments);
    }
  }
}
