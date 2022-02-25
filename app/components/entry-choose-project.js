import Component from '@glimmer/component';
import { action, computed } from '@ember/object';
import { reads } from '@ember/object/computed';
import { isEmpty, isPresent } from '@ember/utils';
import { tracked } from '@glimmer/tracking';
import { service } from '@ember/service';

export default class EntryChooseProjectComponent extends Component {
  @service deferer;

  @tracked projects = null;
  @tracked hoveredProject = null;

  @reads('args.classNamePrefix') classNamePrefix;
  @reads('args.focusOnInput') focusOnInput;

  @computed('args.projectName')
  get projectName() {
    return this.args.projectName;
  }
  set projectName(value) {
    return value;
  }

  @computed('classNamePrefix')
  get inputClasses() {
    return `text-input ${this.classNamePrefix}-project`;
  }

  @computed('classNamePrefix')
  get projectsListClasses() {
    return `${this.classNamePrefix}-project-choices`;
  }

  @computed('classNamePrefix')
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
    this.deferer.later(
      'entry-choose-project:clear',
      this,
      () => {
        if (this.isDestroying || this.isDestroyed) return;
        this.projects = null;
      }
    )
  }

  @action keyPressed(event) {
    if (event.key === 'Enter') {
      this._selectOrClearIfEmpty();
    } else if (event.key === 'ArrowDown') {
      this._moveHoveredProject(+1);
    } else if (event.key === 'ArrowUp') {
      this._moveHoveredProject(-1);
    } else {
      this.args.keyPressed?.();
      this.deferer.debounce('entry-choose-project:seearch', this, this._searchProjects);
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

  _selectOrClearIfEmpty() {
    const newProject = isPresent(this.projectName) ? this.hoveredProject : null;
    this.selectProject(newProject);
  }

  _searchProjects() {
    const query = this.projectName;
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
