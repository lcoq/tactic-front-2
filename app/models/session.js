import { attr, belongsTo } from '@ember-data/model';

import BaseModel from './base-model';

export default class SessionModel extends BaseModel {
  @attr token;
  @attr name;
  @attr password;
  @belongsTo user;

  get userId() {
    return this.belongsTo('user').id();
  }
}
