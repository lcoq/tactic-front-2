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

  addEntry(entry) {
    this._addEntries([entry]);
  }

  removeEntry(entry) {
    const group = this._findGroupByEntry(entry);
    this._removeEntryFromGroupAndPossiblyWholeGroup(group, entry);
    this.entries.removeObject(entry);
  }

  updateEntry(entry) {
    const day = this._entryDay(entry);
    const previousGroup = this._findGroupByEntry(entry);
    const newGroup = this._findGroup(day);
    if (previousGroup !== newGroup) {
      this._removeEntryFromGroupAndPossiblyWholeGroup(previousGroup, entry);
      this.addEntry(entry);
    }
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
    return this._findGroup(day) || this._createGroup(day);
  }

  _addEntryToGroup(group, entry) {
    const entries = group.entries;
    const entryMomentStartedAt = moment(entry.startedAt);
    const insertIndex = this._findInsertIndex(entries, (e) =>
      entryMomentStartedAt.isAfter(e.startedAt)
    );
    entries.insertAt(insertIndex, entry);
  }

  _findGroup(day) {
    const momentDay = moment(day);
    return this.groups.find((g) => momentDay.isSame(g.day));
  }

  _createGroup(day) {
    const momentDay = moment(day);
    const group = EntryGroupModel.create({ day });
    const insertIndex = this._findInsertIndex(this.groups, (g) =>
      momentDay.isAfter(g.day)
    );
    this.groups.insertAt(insertIndex, group);
    return group;
  }

  _findGroupByEntry(entry) {
    return this.groups.find((g) => g.entries.includes(entry));
  }

  _removeEntryFromGroupAndPossiblyWholeGroup(group, entry) {
    if (group.entries.length === 1) {
      this.groups.removeObject(group);
    } else {
      group.entries.removeObject(entry);
    }
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
