import { module, test } from 'qunit';
import { visit, currentURL, click, fillIn, settled } from '@ember/test-helpers';
import { setupApplicationTest } from 'ember-qunit';
import { setupMirage } from 'ember-cli-mirage/test-support';

import { setupUtils } from '../../utils/setup';

module('Acceptance | Reviews > Transition', function (hooks) {
  setupApplicationTest(hooks);
  setupMirage(hooks);
  setupUtils(hooks);

  test('waits for entry edit to save before transition', async function (assert) {
    this.utils.stubs.stubForNativeTimeoutOn(
      'mutable-record-state-manager:save'
    );

    const user = await this.utils.authentication.authenticate();
    this.server.create('entry', { user });

    this.server.patch('/entries/:id', { timing: 100 });

    await visit('/reviews');

    await click(`[data-test-entry-title]`);
    await fillIn(`[data-test-entry-edit-title]`, 'My new title');
    click('[data-test-header]'); // do not await here
    await this.utils.sleep(20);

    click('[data-test-index-link]'); // do not `await` here
    await this.utils.sleep(50);

    assert.strictEqual(
      currentURL(),
      '/reviews',
      'should stay on reviews page until entry save'
    );

    await settled();
    assert.notStrictEqual(
      currentURL(),
      '/reviews',
      'should transition after entry save'
    );
  });
});
