import Component from '@glimmer/component';
import { action } from '@ember/object';
import { service } from '@ember/service';
import formatDuration from '../utils/format-duration';
import { next } from '@ember/runloop';

export default class CreateEntryComponent extends Component {
  @service deferer;
  @service('clock') clockService;

  get clock() {
    return this.clockService.clock;
  }

  get entry() {
    return this.args.entry;
  }

  get isSaveErrored() {
    return this.args.isSaveErrored;
  }

  get searchProjects() {
    return this.args.searchProjects;
  }

  get didUpdateEntry() {
    return this.args.didUpdateEntry;
  }

  get forceSaveEntry() {
    return this.args.forceSaveEntry;
  }

  get retrySaveEntry() {
    return this.args.retrySaveEntry;
  }

  get isStarted() {
    return this.entry.isStarted;
  }

  get entryDuration() {
    return formatDuration(this.entry.startedAt, this.clock);
  }

  @action onTitleKeyUp(event) {
    this.entry.title = event.target.value;
    if (!this.isStarted) {
      this.startTimer();
    } else {
      this.didUpdateEntry();
    }
  }

  @action startTimer() {
    if (this.isStarted) return;
    this.args.startTimer();
  }

  @action stopTimer() {
    this.args.stopTimer();
  }

  @action selectProject(project) {
    this.args.setProject(project);
  }

  @action onTitlePaste(event) {
    next(() => {
      this.entry.title = event.target.value;
      if (!this.isStarted) {
        this.startTimer();
      } else {
        this.args.forceSaveEntry();
      }
    });
  }
}
