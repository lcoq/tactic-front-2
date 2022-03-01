/* eslint-disable ember/no-get */

import EntryGroupTreeModel from './entry-group-tree';
import ReverseChronologicalEntryGroupModel from './reverse-chronological-entry-group';
import findInsertIndex from '../utils/find-insert-index';
import { get } from '@ember/object';

export default class EntryGroupByProjectListModel extends EntryGroupTreeModel {
  findGroupForEntry(entry) {
    const projectId = get(entry, 'project.id');
    return this.groups.find((g) => get(g, 'project.id') === projectId);
  }

  createGroupForEntry(entry) {
    const project = entry.belongsTo('project').value();
    return new ReverseChronologicalEntryGroupModel({ project });
  }

  findGroupInsertIndex(group) {
    const projectName = get(group, 'project.name');
    return projectName
      ? findInsertIndex(
          this.groups,
          (g) => projectName < get(g, 'project.name')
        )
      : 0;
  }
}
