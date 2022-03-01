import EntryGroupTreeModel from './entry-group-tree';
import ReverseChronologicalEntryGroupModel from './reverse-chronological-entry-group';
import findInsertIndex from '../utils/find-insert-index';

export default class EntryGroupByProjectListModel extends EntryGroupTreeModel {
  findGroupForEntry(entry) {
    const projectId = entry.belongsTo('project').id();
    return this.groups.find((g) => (g.project?.id || null) === projectId);
  }

  createGroupForEntry(entry) {
    const project = entry.belongsTo('project').value();
    return new ReverseChronologicalEntryGroupModel({ project });
  }

  findGroupInsertIndex(group) {
    const projectName = group.project?.name;
    return projectName
      ? findInsertIndex(this.groups, (g) => projectName < g.project?.name)
      : 0;
  }
}
