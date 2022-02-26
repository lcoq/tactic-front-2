import StateManagerModel from './state-manager';
import StateManagerStateModel from './state-manager-state';
import { getOwner } from '@ember/application';
import { resolve, reject } from 'rsvp';

class StateModel extends StateManagerStateModel {
  get entry() {
    return this.source;
  }
}

class ClearStateModel extends StateModel {
  name = 'clear';
  isClear = true;

  get actions() {
    return {
      start() {
        this.entry.start();
        this.transitionTo('pendingSave');
        return this.sendToCurrentState('forceSave');
      },
      startWithSaveError() {
        this.entry.start();
        this.transitionTo('saveError');
      },
      stop() {
        this.entry.stop();
        this.transitionTo('pendingSave');
        return this.sendToCurrentState('forceSave');
      },
      update() {
        this.transitionTo('pendingSave');
      },
    };
  }
}

class PendingSaveStateModel extends StateModel {
  name = 'pendingSave';
  isPendingSave = true;

  _saveTimer = null;
  _previousSavePromise = resolve();

  enter() {
    this._startTimer();
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
      update() {
        this._cancelTimer();
        this._startTimer();
      },
      stop() {
        this._cancelTimer();
        this.entry.stop();
        return this._save();
      },
    };
  }

  _save() {
    this._saveTimer = null;
    const save = () => {
      return this.source.save();
    };
    const newPromise = this._previousSavePromise.then(save, save).then(
      () => {
        this.emit('didSave');
        this.transitionTo('clear'); // TODO prevent transition clear -> clear ?
      },
      () => {
        this.transitionTo('saveError');
        return reject();
      }
    );
    this._previousSavePromise = newPromise;
    return newPromise;
  }

  _startTimer() {
    this._saveTimer = this.deferer.later(
      'running-entry-state-manager:save',
      this,
      this._save
    );
  }

  _cancelTimer() {
    const timer = this._saveTimer;
    if (timer) {
      this.deferer.cancel('running-entry-state-manager:save', timer);
      this._saveTimer = null;
    }
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
      update() {
        this.transitionTo('pendingSave');
      },
      stop() {
        this.entry.stop();
        this.transitionTo('pendingSave');
        return this.sendToCurrentState('forceSave');
      },
    };
  }
}

export default class RunningEntryStateManagerModel extends StateManagerModel {
  get isClear() {
    return this.currentState.isClear;
  }

  get isPendingSave() {
    return this.currentState.isPendingSave;
  }

  get isSaveErrored() {
    return this.currentState.isSaveErrored;
  }

  get defererService() {
    return getOwner(this.source).lookup('service:deferer');
  }

  get stateClasses() {
    return [ClearStateModel, PendingSaveStateModel, SaveErrorStateModel];
  }

  instantiateStateClass(klass) {
    const instance = super.instantiateStateClass(klass);
    instance.deferer = this.defererService;
    return instance;
  }
}
