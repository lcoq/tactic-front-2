import EntryGroupModel from './entry-group';
import { tracked } from '@glimmer/tracking';

export default class EntryGroupTreeModel extends EntryGroupModel {
  @tracked groups = [];

  /* hook */
  findGroupForEntry(/* entry */) {}

  /* hook */
  createGroupForEntry(/* entry */) {}

  /* hook */
  findGroupInsertIndex(/* group */) {}

  addEntry(entry) {
    super.addEntry(...arguments);
    this._addEntryToGroups(entry);
  }

  removeEntry(entry) {
    super.removeEntry(...arguments);
    this._removeEntryFromGroups(entry);
  }

  updateEntry(entry) {
    const previousGroup = this._findGroupByEntry(entry);
    const newGroup = this.findGroupForEntry(entry);
    if (previousGroup !== newGroup) {
      this.removeEntry(entry);
      this.addEntry(entry);
    }
  }

  _addEntryToGroups(entry) {
    const existingGroup = this.findGroupForEntry(entry);
    if (existingGroup) {
      existingGroup.addEntry(entry);
    } else {
      const newGroup = this.createGroupForEntry(entry);
      newGroup.addEntry(entry);
      const newGroupIndex = this.findGroupInsertIndex(newGroup);
      this.groups.insertAt(newGroupIndex, newGroup);
    }
  }

  _removeEntryFromGroups(entry) {
    const group = this._findGroupByEntry(entry);
    if (group.entries.length === 1) {
      this.groups.removeObject(group);
    } else {
      group.removeEntry(entry);
    }
  }

  _findGroupByEntry(entry) {
    return this.groups.find((g) => g.entries.includes(entry));
  }
}
