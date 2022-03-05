import { all } from 'rsvp';

export default class StateManagerListCommitter {
  constructor() {
    this.list = [];
  }

  get isClear() {
    return (
      this._invalidList.length === 0 &&
      this._editingList.length === 0 &&
      this._pendingSaveList.length === 0 &&
      this._pendingDeleteList.length === 0 &&
      this._erroredList.length === 0
    );
  }

  get hasInvalid() {
    return this._invalidList.length > 0;
  }

  addObject(object) {
    this.list.pushObject(object);
  }

  addObjects(objects) {
    this.list.pushObjects(objects);
  }

  clearInvalids() {
    this._invalidList.forEach((e) => e.send('clear'));
  }

  commit() {
    this._editingList.forEach((e) => e.send('markForSave'));
    return all([
      ...this._pendingSaveList.map((e) => e.send('forceSave')),
      ...this._pendingDeleteList.map((e) => e.send('forceDelete')),
      ...this._erroredList.map((e) => e.send('retry')),
    ]);
  }

  get _invalidList() {
    return this.list.filterBy('isInvalid', true);
  }

  get _editingList() {
    return this.list.filterBy('isEditing', true);
  }

  get _pendingSaveList() {
    return this.list.filterBy('isPendingSave', true);
  }

  get _pendingDeleteList() {
    return this.list.filterBy('isPendingDelete', true);
  }

  get _erroredList() {
    return this.list.filterBy('isSaveErrored', true);
  }
}
