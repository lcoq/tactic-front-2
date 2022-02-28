import StateManagerModel from './state-manager';
import StateManagerStateModel from './state-manager-state';
import { reject } from 'rsvp';
import { getOwner } from '@ember/application';

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
        const source = this.source;
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
    this._saveTimer = this.deferer.later(
      'mutable-record-state-manager:save',
      this,
      this._save
    );
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
      this.deferer.cancel('mutable-record-state-manager:save', timer);
      this._saveTimer = null;
    }
  }
}

class PendingDeleteStateModel extends StateModel {
  name = 'pendingDelete';
  isPendingDelete = true;

  _deleteTimer = null;

  enter() {
    this._deleteTimer = this.deferer.later(
      'mutable-record-state-manager:delete',
      this,
      this._delete
    );
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
      this.deferer.cancel('mutable-record-state-manager:delete', timer);
      this._deleteTimer = null;
    }
  }
}

export default class MutableRecordStateManagerModel extends StateManagerModel {
  get isClear() {
    return this.currentState.isClear;
  }

  get isEditing() {
    return this.currentState.isEditing;
  }

  get isInvalid() {
    return this.currentState.isInvalid;
  }

  get isPendingSave() {
    return this.currentState.isPendingSave;
  }

  get isSaveErrored() {
    return this.currentState.isSaveErrored;
  }

  get isPendingDelete() {
    return this.currentState.isPendingDelete;
  }

  get isDeleteErrored() {
    return this.currentState.isDeleteErrored;
  }

  get isPendingSaveOrSaveErrored() {
    return this.isPendingSave || this.isSaveErrored;
  }

  get isPendingDeleteOrDeleteErrored() {
    return this.isPendingDelete || this.isDeleteErrored;
  }

  get isErrored() {
    return this.isSaveErrored || this.isDeleteErrored;
  }

  get defererService() {
    return getOwner(this.source).lookup('service:deferer');
  }

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
    if (source.isDeleted && !source.hasDirtyAttributes) {
      return false;
    } else if (source.isNew) {
      return true;
    } else {
      return Object.keys(source.changedAttributes()).length !== 0;
    }
  }

  checkValid() {
    return true;
  }

  rollback(source) {
    source.rollbackAttributes();
  }

  instantiateStateClass(klass) {
    const instance = super.instantiateStateClass(klass);
    instance.deferer = this.defererService;
    return instance;
  }
}
