import { attr, hasMany, belongsTo } from '@ember-data/model';

import BaseModel from './base-model';

export default class UserNotificationListModel extends BaseModel {
  @belongsTo user;
  @hasMany('user-notification') notifications;
  @attr('string') status;
}
