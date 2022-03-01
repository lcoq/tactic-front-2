import moment from 'moment';

import EntryGroupModel from './entry-group';
import findInsertIndex from '../utils/find-insert-index';

export default class ReverseChronologicalEntryGroupModel extends EntryGroupModel {
  addEntry(entry) {
    const startedAt = moment(entry.startedAt);
    const index = findInsertIndex(this.entries, (e) =>
      startedAt.isAfter(e.startedAt)
    );
    this.entries.insertAt(index, entry);
  }
}
