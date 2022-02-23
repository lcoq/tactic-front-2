import MutableRecordStateManagerModel from './mutable-record-state-manager';
import { reads } from '@ember/object/computed';

export default class EntryStateManagerModel extends MutableRecordStateManagerModel {
  @reads('source') entry;

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
