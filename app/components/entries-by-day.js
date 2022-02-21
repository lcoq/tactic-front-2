import Component from '@glimmer/component';
import { reads } from '@ember/object/computed';
import { action } from '@ember/object';

export default class EntriesByDayComponent extends Component {
  @reads('args.list') list;

  @reads('args.willUpdateEntry') willUpdateEntry;
  @reads('args.willDeleteEntry') willDeleteEntry;
  @reads('args.didRevertEntry') didRevertEntry;
  @reads('args.restartEntry') restartEntry;
  @reads('args.searchProjects') searchProjects;

  @action didUpdateEntry(entry) {
    this.list.updateEntry(entry);
    this.args.didUpdateEntry?.(entry);
  }

  @action didDeleteEntry(entry) {
    this.list.removeEntry(entry);
    this.args.didDeleteEntry?.(entry);
  }
}
