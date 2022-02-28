import Component from '@glimmer/component';
import { action } from '@ember/object';
import OnFocusOutClickModifier from '../modifiers/on-focus-out-click';
import NoopModifier from '../modifiers/noop';

export default class ShowClientComponent extends Component {
  // TODO on did delete / off did delete

  get client() {
    return this.args.client;
  }

  get onFocusOutClickModifier() {
    return this.isEditing ? OnFocusOutClickModifier : NoopModifier;
  }

  get isFrozen() {
    return this.client.isFrozen;
  }

  get isClear() {
    return this.client.stateManager.isClear;
  }

  get isEditing() {
    return this.client.stateManager.isEditing;
  }

  get isPendingDelete() {
    return this.client.stateManager.isPendingDelete;
  }

  get isPendingSave() {
    return this.client.stateManager.isPendingSave;
  }

  get isInvalid() {
    return this.client.stateManager.isInvalid;
  }

  get isSaveErrored() {
    return this.client.stateManager.isSaveErrored;
  }

  get isDeleteErrored() {
    return this.client.stateManager.isDeleteErrored;
  }

  get isErrored() {
    return this.isSaveErrored || this.isDeleteErrored;
  }

  get canRevert() {
    return this.isPendingSave || this.isPendingDelete || this.isInvalid;
  }

  get classNames() {
    const names = [];
    if (this.isFrozen) names.push('frozen');
    if (this.isEditing) names.push('editing');
    if (this.isPendingDelete) names.push('deleting');
    if (this.isPendingSave) names.push('pending');
    if (this.isInvalid) names.push('invalid');
    if (this.isSaveErrored) names.push('save-errored');
    if (this.isDeleteErrored) names.push('delete-errored');
    return names.join(' ');
  }

  @action startEdit() {
    if (this.isFrozen) return;
    this.args.startEdit(this.client);
  }

  @action closeEdit() {
    this.args.stopEdit(this.client);
  }

  @action retrySaveOrDelete() {
    this.args.retrySaveOrDelete(this.client);
  }

  @action revertEdit() {
    this.args.cancelEdit(this.client);
  }

  @action markForDelete() {
    this.args.markForDelete(this.client);
  }

  constructor() {
    super(...arguments);
    this.client.stateManager.once('didDelete', this._didDeleteClient, this);
  }

  _didDeleteClient() {
    this.args.didDelete?.(this.client);
  }
}
