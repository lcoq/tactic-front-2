const api = {
  stub(target, methodName, replacement) {
    const initial = target[methodName];
    target[methodName] = replacement;
    this._stubbedCallbacks.push(() => (target[methodName] = initial));
    return initial;
  },

  /* This stubs the deferer service by removing running entry clock updates.
     This avoids infinite loop issue due to constant restart of the timer.
  */
  stubCreateEntryClock() {
    const deferer = this._context.owner.lookup('service:deferer');
    const initialLater = this.stub.call(this, deferer, 'later', function (key) {
      if (key === 'create-entry:clock') {
        return 12345;
      } else {
        return initialLater.apply(deferer, arguments);
      }
    });
  },

  /* This stubs the deferer service to use native timeout with "reasonable" delay.
     This allows to test `rollback` on entry as `await` will not wait the
     pending save entry state to actually save the entry */
  stubForNativeTimeoutOn(keyForNativeTimeout) {
    const deferer = this._context.owner.lookup('service:deferer');
    const initialUsesNativeTimeout = this.stub.call(
      this,
      deferer,
      'usesNativeTimeout',
      function (key) {
        if (key === keyForNativeTimeout) {
          return true;
        } else {
          return initialUsesNativeTimeout.call(deferer);
        }
      }
    );
    const initialWait = this.stub.call(this, deferer, 'wait', function (key) {
      if (key === keyForNativeTimeout) {
        return 20;
      } else {
        return initialWait.call(deferer);
      }
    });
  },
};

export default function setupStubs(hooks) {
  hooks.beforeEach(function () {
    this.utils.stubs = Object.assign(
      {
        _context: this,
        _stubbedCallbacks: [],
      },
      api
    );
  });
  hooks.afterEach(function () {
    this.utils.stubs._stubbedCallbacks.forEach((callback) => callback());
  });
}
