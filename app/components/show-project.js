import Component from '@glimmer/component';
import { action } from '@ember/object';
import OnFocusOutClickModifier from '../modifiers/on-focus-out-click';
import NoopModifier from '../modifiers/noop';

export default class ShowProjectComponent extends Component {
  get project() {
    return this.args.project;
  }

  get deleteIsDisabled() {
    return this.args.deleteIsDisabled;
  }

  get deleteIsEnabled() {
    return !this.args.deleteIsDisabled;
  }

  get onFocusOutClickModifier() {
    return this.isEditing ? OnFocusOutClickModifier : NoopModifier;
  }

  get isClear() {
    return this.project.stateManager.isClear;
  }

  get isEditing() {
    return this.project.stateManager.isEditing;
  }

  get isPendingDelete() {
    return this.project.stateManager.isPendingDelete;
  }

  get isPendingSave() {
    return this.project.stateManager.isPendingSave;
  }

  get isInvalid() {
    return this.project.stateManager.isInvalid;
  }

  get isSaveErrored() {
    return this.project.stateManager.isSaveErrored;
  }

  get isDeleteErrored() {
    return this.project.stateManager.isDeleteErrored;
  }

  get isErrored() {
    return this.isSaveErrored || this.isDeleteErrored;
  }

  get canRevert() {
    return this.isPendingSave || this.isPendingDelete || this.isInvalid;
  }

  get canDelete() {
    return this.isClear && this.deleteIsEnabled;
  }

  get classNames() {
    const names = [];
    if (this.isEditing) names.push('project--editing');
    if (this.isPendingDelete) names.push('project--deleting');
    if (this.isPendingSave) names.push('project--pending');
    if (this.isInvalid) names.push('project--invalid');
    if (this.isSaveErrored) names.push('project--save-errored');
    if (this.isDeleteErrored) names.push('project--delete-errored');
    return names.join(' ');
  }

  @action startEdit() {
    this.args.startEdit(this.project);
  }

  @action closeEdit() {
    this.args.stopEdit(this.project);
  }

  @action retrySaveOrDelete() {
    this.args.retrySaveOrDelete(this.project);
  }

  @action revertEdit() {
    this.args.cancelEdit(this.project);
  }

  @action markForDelete() {
    this.args.markForDelete(this.project);
  }

  constructor() {
    super(...arguments);
    this.project.stateManager.once('didDelete', this._didDeleteProject, this);
  }

  _didDeleteProject() {
    this.args.didDelete?.(this.project);
  }
}
