import moment from 'moment';

import EntryGroupTreeModel from './entry-group-tree';
import ReverseChronologicalEntryGroupModel from './reverse-chronological-entry-group';
import findInsertIndex from '../utils/find-insert-index';

export default class EntryGroupByDayListModel extends EntryGroupTreeModel {
  findGroupForEntry(entry) {
    const day = this._entryDay(entry);
    return this.groups.find((g) => day.isSame(g.day));
  }

  createGroupForEntry(entry) {
    const day = this._entryDay(entry).toDate();
    return new ReverseChronologicalEntryGroupModel({ day });
  }

  findGroupInsertIndex(group) {
    const day = moment(group.day);
    return findInsertIndex(this.groups, (g) => day.isAfter(g.day));
  }

  _entryDay(entry) {
    return moment(entry.startedAt).startOf('day');
  }
}
