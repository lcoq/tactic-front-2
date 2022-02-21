import StateManagerModel from './state-manager';
import StateManagerStateModel from './state-manager-state';
import { later, cancel } from '@ember/runloop';
import { reject } from 'rsvp';
import { reads, or } from '@ember/object/computed';

import ENV from '../config/environment';
const PENDING_TIMER_MS = ENV.environment !== 'test' ? 3000 : 50;

const StateModel = StateManagerStateModel;

class ClearStateModel extends StateModel {
  name = 'clear';
  isClear = true;

  enter() {
    const source = this.source;
    if (this.manager.checkDirty(source)) {
      this.manager.rollback(source);
    }
  }

  get actions() {
    return {
      edit() {
        this.transitionTo('editing');
      },
      markForDelete() {
        this.transitionTo('pendingDelete');
      },
    };
  }
}

class EditingStateModel extends StateModel {
  name = 'editing';
  isEditing = true;

  get actions() {
    return {
      markForSave() {
        const source = this.source;
        if (this.manager.checkValid(source)) {
          this.transitionTo('pendingSave');
        } else {
          this.transitionTo('invalid');
        }
      },
    };
  }
}

class InvalidStateModel extends StateModel {
  name = 'invalid';
  isInvalid = true;

  get actions() {
    return {
      edit() {
        this.transitionTo('editing');
      },
      clear() {
        this.transitionTo('clear');
      },
    };
  }
}

class SaveErrorStateModel extends StateModel {
  name = 'saveError';
  isSaveErrored = true;

  get actions() {
    return {
      retry() {
        this.transitionTo('pendingSave');
        return this.sendToCurrentState('forceSave');
      },
      edit() {
        this.transitionTo('editing');
      },
    };
  }
}

class DeleteErrorStateModel extends StateModel {
  name = 'deleteError';
  isDeleteErrored = true;

  get actions() {
    return {
      retry() {
        this.transitionTo('pendingDelete');
        return this.sendToCurrentState('forceDelete');
      },
      edit() {
        const source = get(this, 'source');
        this.manager.rollback(source);
        this.transitionTo('editing');
      },
    };
  }
}

class PendingSaveStateModel extends StateModel {
  name = 'pendingSave';
  isPendingSave = true;

  _saveTimer = null;

  enter() {
    const timer = later(this, this._save, PENDING_TIMER_MS);
    this._saveTimer = timer;
  }

  leave() {
    this._cancelTimer();
  }

  get actions() {
    return {
      forceSave() {
        this._cancelTimer();
        return this._save();
      },
      edit() {
        this.transitionTo('editing');
      },
      clear() {
        this.transitionTo('clear');
      },
    };
  }

  _save() {
    this._saveTimer = null;
    const source = this.source;
    return source.save().then(
      () => {
        this.emit('didSave');
        this.send('clear');
      },
      () => {
        const newStateName = source.isValid ? 'saveError' : 'invalid';
        this.transitionTo(newStateName);
        return reject();
      }
    );
  }

  _cancelTimer() {
    const timer = this._saveTimer;
    if (timer) {
      cancel(timer);
      this._saveTimer = null;
    }
  }
}

class PendingDeleteStateModel extends StateModel {
  name = 'pendingDelete';
  isPendingDelete = true;

  _deleteTimer = null;

  enter() {
    const timer = later(this, this._delete, PENDING_TIMER_MS);
    this._deleteTimer = timer;
  }

  leave() {
    this._cancelTimer();
  }

  get actions() {
    return {
      forceDelete() {
        this._cancelTimer();
        return this._delete();
      },
      edit() {
        this.transitionTo('editing');
      },
      clear() {
        this.transitionTo('clear');
      },
    };
  }

  _delete() {
    this._deleteTimer = null;
    const source = this.source;
    return source.destroyRecord().then(
      () => {
        this.emit('didDelete');
        this.send('clear');
      },
      () => {
        this.transitionTo('deleteError');
        return reject();
      }
    );
  }

  _cancelTimer() {
    const timer = this._deleteTimer;
    if (timer) {
      cancel(timer);
      this._deleteTimer = null;
    }
  }
}

export default class MutableRecordStateManagerModel extends StateManagerModel {
  @reads('currentState.isClear') isClear;
  @reads('currentState.isEditing') isEditing;
  @reads('currentState.isInvalid') isInvalid;

  @reads('currentState.isPendingSave') isPendingSave;
  @reads('currentState.isSaveErrored') isSaveErrored;
  @or('isPendingSave', 'isSaveErrored') isPendingSaveOrSaveErrored;

  @reads('currentState.isPendingDelete') isPendingDelete;
  @reads('currentState.isDeleteErrored') isDeleteErrored;
  @or('isPendingDelete', 'isDeleteErrored') isPendingDeleteOrDeleteErrored;

  @or('isSaveErrored', 'isDeleteErrored') isErrored;

  get stateClasses() {
    return [
      ClearStateModel,
      EditingStateModel,
      InvalidStateModel,
      PendingSaveStateModel,
      SaveErrorStateModel,
      PendingDeleteStateModel,
      DeleteErrorStateModel,
    ];
  }

  checkDirty(source) {
    return Object.keys(source.changedAttributes()).length !== 0 || source.isDeleted;
  }

  checkValid() {
    return true;
  }

  rollback(source) {
    source.rollbackAttributes();
  }
}
