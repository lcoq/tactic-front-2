import EntryGroupModel from './entry-group';
import { tracked } from '@glimmer/tracking';
import moment from 'moment';

export default class EntryGroupByDayListModel extends EntryGroupModel {
  @tracked groups = null;

  init() {
    super.init(...arguments);
    this.groups = [];
    this._addEntries(this.entries);
  }

  _addEntries(entries) {
    entries.forEach((entry) => {
      this._addEntryAndPossiblyCreateGroup(entry);
    });
  }

  _addEntryAndPossiblyCreateGroup(entry) {
    const day = this._entryDay(entry);
    const group = this._findOrCreateGroup(day);
    this._addEntryToGroup(group, entry);
  }

  _findOrCreateGroup(day) {
    const momentDay = moment(day);
    let group = this.groups.find((g) => momentDay.isSame(g.day));
    if (!group) {
      group = EntryGroupModel.create({ day });
      const insertIndex = this._findInsertIndex(this.groups, (g) =>
        momentDay.isAfter(g.day)
      );
      this.groups.insertAt(insertIndex, group);
    }
    return group;
  }

  _addEntryToGroup(group, entry) {
    const entries = group.entries;
    const entryMomentStartedAt = moment(entry.startedAt);
    const insertIndex = this._findInsertIndex(entries, (e) =>
      entryMomentStartedAt.isAfter(e.startedAt)
    );
    entries.insertAt(insertIndex, entry);
  }

  _entryDay(entry) {
    return moment(entry.startedAt).startOf('day').toDate();
  }

  _findInsertIndex(array, callback) {
    const nextObject = array.find(callback);
    const nextObjectIndex = array.indexOf(nextObject);
    return nextObjectIndex !== -1 ? nextObjectIndex : array.length;
  }
}
