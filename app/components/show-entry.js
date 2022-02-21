import Component from '@glimmer/component';
import { reads, and, or } from '@ember/object/computed';
import { action, computed } from '@ember/object';
import { tracked } from '@glimmer/tracking';

export default class ShowEntryComponent extends Component {
  @tracked fieldNameToFocusOnEdit = null;
  @tracked rounding = false;

  @reads('args.entry') entry;

  @reads('entry.stateManager.isClear') isClear;
  @reads('entry.stateManager.isEditing') isEditing;
  @reads('entry.stateManager.isPendingDelete') isPendingDelete;
  @reads('entry.stateManager.isPendingSave') isPendingSave;
  @reads('entry.stateManager.isErrored') isErrored;
  @reads('entry.stateManager.isSaveErrored') isSaveErrored;
  @reads('entry.stateManager.isDeleteErrored') isDeleteErrored;
  @or('isPendingSave', 'isPendingDelete') canRevert;
  @and('restartEntry', 'entry.isClear') canRestartEntry;

  @computed('isEditing', 'isPendingDelete', 'isPendingSave', 'isSaveErrored', 'isDeleteErrored', 'rounding')
  get classNames() {
    const names = [];
    if (this.isEditing) names.push("editing");
    if (this.isPendingDelete) names.push("deleting");
    if (this.isPendingSave) names.push("pending");
    if (this.isSaveErrored) names.push("errored");
    if (this.isDeleteErrored) names.push("errored");
    if (this.rounding) names.push("disabled");
    return names.join(' ');
  }

  @action editEntry(field) {
    if (!this.entry.stateManager.isEditing) {
      this._openEdit(field);
    }
  }

  @action closeEdit() {
    if (this.entry.stateManager.isEditing) {
      this._closeEdit();
    }
  }

  @action retrySaveOrDeleteEntry() {
    this.entry.stateManager.send('retry');
  }

  @action revertEditEntry() {
    this.args.didRevertEntry?.(this.entry);
    this.entry.stateManager.send('clear');
  }

  @action markEntryForDelete() {
    this.args.willDeleteEntry?.(this.entry);
    this.entry.stateManager.send('markForDelete');
  }

  @action changeEntryDate() {
  }

  @action restartEntry() {
    this.args.restartEntry?.(this.entry);
  }

  constructor() {
    super(...arguments);
    this.entry.stateManager.once('didDelete', this._didDeleteEntry, this);
    this.entry.stateManager.once('didSave', this._didUpdateEntry, this);
  }

  willDestroy() {
    super.willDestroy(...arguments);
    this.entry.stateManager.off('didDelete', this._didDeleteEntry, this);
    this.entry.stateManager.off('didSave', this._didUpdateEntry, this);
  }

  _openEdit(field) {
    this.fieldNameToFocusOnEdit = field;
    this.entry.stateManager.send('edit');
  }

  _closeEdit() {
    if (this.isEditing) {
      if (this.args.willUpdateEntry) {
        this.args.willUpdateEntry(this.entry);
      }
      this.entry.stateManager.send('markForSave');
    }
  }

  _didUpdateEntry() {
    this.args.didUpdateEntry?.(this.entry);
    this.entry.stateManager.once('didSave', this._didUpdateEntry, this);
  }

  _didDeleteEntry() {
    this.args.didDeleteEntry?.(this.entry);
  }
}
