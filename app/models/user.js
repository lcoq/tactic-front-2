import { attr, hasMany } from '@ember-data/model';

import BaseModel from './base-model';

export default class UserModel extends BaseModel {
  @attr('string') name;
  @attr('string') password;
  @hasMany('user-config') configs;
}
