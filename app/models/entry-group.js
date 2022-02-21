import EmberObject from '@ember/object';
import { tracked } from '@glimmer/tracking';
import { mapBy, sum } from '@ember/object/computed';

export default class EntryGroupModel extends EmberObject {
  @tracked entries = null;

  init() {
    super.init(...arguments);
    this.entries ??= [];
  }

  @mapBy('entries', 'durationInSeconds') _entriesDurationsInSeconds;
  @sum('_entriesDurationsInSeconds') durationInSeconds;
}
