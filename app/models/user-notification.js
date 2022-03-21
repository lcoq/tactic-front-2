import { attr, belongsTo } from '@ember-data/model';

import BaseModel from './base-model';

export default class UserNotificationModel extends BaseModel {
  @attr('date') createdAt;
  @attr('string') nature;
  @attr('string') status;
  @attr('string') title;
  @attr('string') message;
  @belongsTo user;
  @belongsTo('base-model', { polymorphic: true, inverse: null }) resource;

  get isUnread() {
    return this.status === 'unread';
  }
}
