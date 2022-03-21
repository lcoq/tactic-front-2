import { attr } from '@ember-data/model';

import BaseModel from './base-model';

export default class EntriesStatModel extends BaseModel {
  @attr('date') date;
  @attr('number') duration;
}
