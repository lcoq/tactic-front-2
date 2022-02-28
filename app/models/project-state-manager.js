import MutableRecordStateManagerModel from './mutable-record-state-manager';
import { isEmpty } from '@ember/utils';

export default class ProjectStateManagerModel extends MutableRecordStateManagerModel {
  get project() {
    return this.source;
  }

  checkValid(project) {
    return !isEmpty(project.name);
  }
}
