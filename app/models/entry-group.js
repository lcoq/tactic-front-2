import { tracked } from '@glimmer/tracking';
import { A } from '@ember/array';

export default class EntryGroupModel {
  @tracked entries = null;

  addEntry(entry) {
    this.entries.pushObject(entry);
  }

  addEntries(entries) {
    entries.forEach(this.addEntry, this);
  }

  updateEntry() {}

  removeEntry(entry) {
    this.entries.removeObject(entry);
  }

  removeEntries(entries) {
    entries.forEach(this.removeEntry, this);
  }

  constructor(attributes) {
    Object.assign(this, attributes, { entries: A([]) });
    if (attributes.entries) this.addEntries(attributes.entries);
  }

  get durationInSeconds() {
    return this.entries.reduce(
      (sum, entry) => sum + entry.durationInSeconds,
      0
    );
  }
}
