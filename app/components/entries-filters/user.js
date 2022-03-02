import Component from '@glimmer/component';
import { action } from '@ember/object';
import { tracked } from '@glimmer/tracking';

export default class EntriesFiltersUserComponent extends Component {
  @tracked pendingSelectedIds;

  get all() {
    return this.args.all;
  }

  get initiallySelectedIds() {
    return this.args.selectedIds;
  }

  get onChange() {
    return this.args.onChange;
  }

  get selectedIds() {
    return this.pendingSelectedIds || this.initiallySelectedIds;
  }

  get allAreInitiallySelected() {
    return this.initiallySelectedIds.length === this.all.length;
  }

  @action checkAll() {
    this.pendingSelectedIds = this.all.mapBy('id');
  }

  @action uncheckAll() {
    this.pendingSelectedIds = [];
  }

  @action changeSelection(id, event) {
    if (!this.pendingSelectedIds) {
      this.pendingSelectedIds = this.initiallySelectedIds;
    }
    if (event.target.checked) {
      this.pendingSelectedIds.push(id);
    } else {
      const index = this.pendingSelectedIds.indexOf(id);
      this.pendingSelectedIds.splice(index, 1);
    }
  }

  @action triggerChanges() {
    if (this.pendingSelectedIds) {
      this.onChange(this.pendingSelectedIds);
      this.pendingSelectedIds = null;
    }
  }
}
