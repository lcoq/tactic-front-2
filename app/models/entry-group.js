import { tracked } from '@glimmer/tracking';

export default class EntryGroupModel {
  @tracked entries = null;

  constructor(attributes) {
    Object.assign(this, attributes);
    this.entries ??= [];
  }

  get durationInSeconds() {
    return this.entries.reduce(
      (sum, entry) => sum + entry.durationInSeconds,
      0
    );
  }
}
