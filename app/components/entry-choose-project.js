import Component from '@glimmer/component';
import { action } from '@ember/object';
import { isEmpty, isPresent } from '@ember/utils';
import { tracked } from '@glimmer/tracking';
import { service } from '@ember/service';

export default class EntryChooseProjectComponent extends Component {
  @service deferer;

  @tracked projects = null;
  @tracked hoveredProject = null;

  @tracked nameInputValue = null;

  @tracked _searchQuery = null;

  get focusOnInput() {
    return this.args.focusOnInput;
  }

  get projectName() {
    return this.args.projectName;
  }

  get inputClasses() {
    return [ 'text-input', this.args.inputClasses || '' ].join(' ');
  }

  @action selectProject(project) {
    this.args.selectProject?.(project);
    this._reset();
  }

  @action changeHoveredProject(project) {
    this.hoveredProject = project;
  }

  @action clearProjects() {
    this.deferer.later('entry-choose-project:clear', this, () => {
      if (this.isDestroying || this.isDestroyed) return;
      this._reset();
    });
  }

  @action keyPressed(event) {
    const inputValue = event.target.value;
    this._searchQuery = inputValue;

    if (event.key === 'Enter') {
      this._selectOrClearIfEmpty(inputValue);
    } else if (event.key === 'ArrowDown') {
      this._moveHoveredProject(+1);
    } else if (event.key === 'ArrowUp') {
      this._moveHoveredProject(-1);
    } else {
      this.args.keyPressed?.();
      this.deferer.debounce('entry-choose-project:search', this, this._searchProjects);
    }
  }

  @action setNameInputValue() {
    this.nameInputValue = this.projectName;
  }

  _moveHoveredProject(diff) {
    if (isEmpty(this.projects)) return;
    const maxIndex = this.projects.length - 1;
    let index = this.projects.indexOf(this.hoveredProject) + diff;
    if (index < 0) {
      index = maxIndex;
    } else if (index > maxIndex) {
      index = 0;
    }
    this.hoveredProject = this.projects.objectAt(index);
  }

  _selectOrClearIfEmpty(value) {
    const newProject = isPresent(value) ? this.hoveredProject : null;
    this.selectProject(newProject);
  }

  _searchProjects() {
    const query = this._searchQuery;
    this.args.searchProjects(query).then((projects) => {
      this._eventuallyUpdateProjects(projects);
    });
  }

  _eventuallyUpdateProjects(projects) {
    if (this.isDestroying || this.isDestroyed) return;
    this.projects = projects;
    if (projects) {
      this.hoveredProject = this.projects.firstObject;
    }
  }

  _reset() {
    document.activeElement?.blur();
    this.nameInputValue = null;
    this.projects = null;
    this._searchQuery = null;
  }
}
