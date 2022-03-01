/* eslint-disable ember/no-get */

import EntryGroupTreeModel from './entry-group-tree';
import EntryGroupByProjectListModel from './entry-group-by-project-list';
import findInsertIndex from '../utils/find-insert-index';
import { get } from '@ember/object';

export default class EntryGroupByClientAndProjectListModel extends EntryGroupTreeModel {
  findGroupForEntry(entry) {
    const clientId = entry.get('project.client.id');
    return this.groups.find((g) => get(g, 'client.id') === clientId);
  }

  createGroupForEntry(entry) {
    const project = entry.belongsTo('project').value();
    const client = project ? project.belongsTo('client').value() : null;
    return new EntryGroupByProjectListModel({ client });
  }

  findGroupInsertIndex(group) {
    const clientName = get(group, 'client.name');
    return clientName
      ? findInsertIndex(this.groups, (g) => clientName < get(g, 'client.name'))
      : 0;
  }
}
