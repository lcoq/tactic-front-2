import MutableRecordStateManagerModel from './mutable-record-state-manager';

export default class EntryStateManagerModel extends MutableRecordStateManagerModel {
  get entry() {
    return this.source;
  }

  checkDirty(entry) {
    if (entry.isDeleted && !entry.hasDirtyAttributes) {
      return false;
    } else {
      return super.checkDirty(...arguments) || entry.projectHasChanged;
    }
  }

  rollback(entry) {
    super.rollback(...arguments);
    entry.rollbackProject();
  }
}
