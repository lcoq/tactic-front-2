import { attr, belongsTo } from '@ember-data/model';

import BaseModel from './base-model';

export default class UserConfig extends BaseModel {
  @belongsTo user;
  @attr type;
  @attr name;
  @attr description;
  @attr value;
}
