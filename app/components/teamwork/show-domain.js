import Component from '@glimmer/component';
import { action } from '@ember/object';
import { tracked } from '@glimmer/tracking';

import OnFocusOutClickModifier from '../../modifiers/on-focus-out-click';
import NoopModifier from '../../modifiers/noop';

export default class TeamworkDomainComponent extends Component {
  @tracked fieldNameToFocusOnEdit = 'name';

  get domain() {
    return this.args.domain;
  }

  get stateManager() {
    return this.domain.stateManager;
  }

  get isClear() {
    return this.stateManager.isClear;
  }

  get isEditing() {
    return this.stateManager.isEditing;
  }

  get isPendingDelete() {
    return this.stateManager.isPendingDelete;
  }

  get isPendingSave() {
    return this.stateManager.isPendingSave;
  }

  get isInvalid() {
    return this.stateManager.isInvalid;
  }

  get isSaveErrored() {
    return this.stateManager.isSaveErrored;
  }

  get isDeleteErrored() {
    return this.stateManager.isDeleteErrored;
  }

  get isErrored() {
    return this.isSaveErrored || this.isDeleteErrored;
  }

  get canRevert() {
    return this.isPendingSave || this.isPendingDelete || this.isInvalid;
  }

  get canDelete() {
    return this.isClear;
  }

  get onFocusOutClickModifier() {
    return this.isEditing ? OnFocusOutClickModifier : NoopModifier;
  }

  get classNames() {
    const names = [];
    if (this.isEditing) names.push('editing');
    if (this.isPendingDelete) names.push('deleting');
    if (this.isPendingSave) names.push('pending');
    if (this.isInvalid) names.push('invalid');
    if (this.isSaveErrored) names.push('errored');
    if (this.isDeleteErrored) names.push('errored');
    return names.map((n) => `teamwork-domain--${n}`).join(' ');
  }

  get nameInputId() {
    const id = this.domain.id ?? '-1';
    return `${id}-name`;
  }

  get aliasInputId() {
    const id = this.domain.id ?? '-1';
    return `${id}-alias`;
  }

  get tokenInputId() {
    const id = this.domain.id ?? '-1';
    return `${id}-token`;
  }

  @action startEdit(field) {
    if (this.isEditing) return;
    this._openEdit(field);
  }

  @action closeEdit() {
    this.stateManager.send('markForSave');
  }

  @action revertEdit() {
    this.args.revert(this.domain);
  }

  @action markForDelete() {
    this.stateManager.send('markForDelete');
  }

  @action retrySaveOrDelete() {
    this.stateManager.send('retry');
  }

  @action changeName(event) {
    this.domain.name = event.target.value;
  }

  @action changeAlias(event) {
    this.domain.alias = event.target.value;
  }

  @action changeToken(event) {
    this.domain.token = event.target.value;
  }

  @action closeEditOnEnter(event) {
    if (event.key === 'Enter') {
      this.closeEdit();
    }
  }

  constructor() {
    super(...arguments);
    this.stateManager.once('didDelete', this._didDelete, this);
  }

  _openEdit(field) {
    if (field) this.fieldNameToFocusOnEdit = field;
    this.stateManager.send('edit');
  }

  _didDelete() {
    this.args.didDelete(this.domain);
  }
}
