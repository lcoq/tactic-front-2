import Component from '@glimmer/component';
import { action } from '@ember/object';
import { isEmpty, isPresent } from '@ember/utils';
import { tracked } from '@glimmer/tracking';
import { service } from '@ember/service';

export default class EntryChooseProjectComponent extends Component {
  @service deferer;

  @tracked projects = null;
  @tracked hoveredProject = null;

  get classNamePrefix() {
    return this.args.classNamePrefix;
  }

  get focusOnInput() {
    return this.args.focusOnInput;
  }

  get projectName() {
    return this.args.projectName;
  }

  get inputClasses() {
    return `text-input ${this.classNamePrefix}-project`;
  }

  get projectsListClasses() {
    return `${this.classNamePrefix}-project-choices`;
  }

  get projectClasses() {
    return `${this.classNamePrefix}-project-choice touch`;
  }

  @action selectProject(project) {
    this.args.selectProject?.(project);
    this.projects = null;
  }

  @action changeHoveredProject(project) {
    this.hoveredProject = project;
  }

  @action clearProjects() {
    this.deferer.later('entry-choose-project:clear', this, () => {
      if (this.isDestroying || this.isDestroyed) return;
      this.projects = null;
    });
  }

  @action keyPressed(event) {
    const inputValue = event.target.value;
    if (event.key === 'Enter') {
      this._selectOrClearIfEmpty(inputValue);
    } else if (event.key === 'ArrowDown') {
      this._moveHoveredProject(+1);
    } else if (event.key === 'ArrowUp') {
      this._moveHoveredProject(-1);
    } else {
      this.args.keyPressed?.();
      this.deferer.debounce('entry-choose-project:search', this, () =>
        this._searchProjects(inputValue)
      );
    }
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

  _searchProjects(query) {
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
}
