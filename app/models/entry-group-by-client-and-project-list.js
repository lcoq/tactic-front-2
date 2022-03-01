import EntryGroupTreeModel from './entry-group-tree';
import EntryGroupByProjectListModel from './entry-group-by-project-list';
import findInsertIndex from '../utils/find-insert-index';

export default class EntryGroupByClientAndProjectListModel extends EntryGroupTreeModel {
  findGroupForEntry(entry) {
    const project = entry.belongsTo('project').value();
    const clientId = project ? project.belongsTo('client').id() : null;
    return this.groups.find((g) => (g.client?.id || null) === clientId);
  }

  createGroupForEntry(entry) {
    const project = entry.belongsTo('project').value();
    const client = project ? project.belongsTo('client').value() : null;
    return new EntryGroupByProjectListModel({ client });
  }

  findGroupInsertIndex(group) {
    const clientName = group.client?.name;
    return clientName
      ? findInsertIndex(this.groups, (g) => clientName < g.client?.name)
      : 0;
  }
}
