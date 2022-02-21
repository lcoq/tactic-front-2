import MutableRecordStateManagerModel from './mutable-record-state-manager';
import { reads } from '@ember/object/computed';

export default class EntryStateManagerModel extends MutableRecordStateManagerModel {
  @reads('source') entry;

  checkDirty(entry) {
    super.checkDirty(...arguments) || entry.projectHasChanged;
  }

  rollback(entry) {
    super.rollback(...arguments);
    entry.rollbackProject();
  }
}
