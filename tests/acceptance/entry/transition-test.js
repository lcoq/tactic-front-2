import { module, test } from 'qunit';
import { visit, currentURL, click, fillIn, typeIn, settled } from '@ember/test-helpers';
import { setupApplicationTest } from 'ember-qunit';
import { setupMirage } from 'ember-cli-mirage/test-support';
import moment from 'moment';

import { setupUtils } from '../../utils/setup';

module('Acceptance | Entry > Transition', function (hooks) {
  setupApplicationTest(hooks);
  setupMirage(hooks);
  setupUtils(hooks);

  test('waits for entry edit to save before transition', async function (assert) {
    this.utils.stubs.stubForNativeTimeoutOn(
      'mutable-record-state-manager:save'
    );

    const user = await this.utils.authentication.authenticate();
    const entry = this.server.create('entry', { user });

    this.server.patch('/entries/:id', { timing: 100 });

    await visit(`/entries/${entry.id}`);

    await click(`[data-test-entry-title]`);
    await fillIn(`[data-test-entry-edit-title]`, 'My new title');
    click('[data-test-header]'); // do not await here
    await this.utils.sleep(20);

    click('[data-test-reviews-link]'); // do not `await` here
    await this.utils.sleep(50);

    assert.strictEqual(
      currentURL(),
      `/entries/${entry.id}`,
      'should stay on index page until entry save'
    );

    await settled();
    assert.notStrictEqual(
      currentURL(),
      `/entries/${entry.id}`,
      'should transition after entry save'
    );
  });

  test('stops entry edit on transition and wait it to save before transition', async function (assert) {
    this.utils.stubs.stubForNativeTimeoutOn(
      'mutable-record-state-manager:save'
    );

    const user = await this.utils.authentication.authenticate();
    const entry = this.server.create('entry', { user });

    this.server.patch('/entries/:id', { timing: 100 });

    await visit(`/entries/${entry.id}`);

    await click(`[data-test-entry-title]`);
    await fillIn(`[data-test-entry-edit-title]`, 'My new title');

    click('[data-test-reviews-link]'); // do not `await` here
    await this.utils.sleep(50);

    assert.strictEqual(
      currentURL(),
      `/entries/${entry.id}`,
      'should stay on index page until entry save'
    );

    await settled();
    assert.notStrictEqual(
      currentURL(),
      `/entries/${entry.id}`,
      'should transition after entry save'
    );
  });

  test('waits for entry delete to save before transition', async function (assert) {
    this.utils.stubs.stubForNativeTimeoutOn(
      'mutable-record-state-manager:delete'
    );

    const user = await this.utils.authentication.authenticate();
    const entry = this.server.create('entry', { user });

    this.server.delete('/entries/:id', { timing: 100 });

    await visit(`/entries/${entry.id}`);

    click(`[data-test-entry-delete]`); // do not await here

    click('[data-test-reviews-link]'); // do not `await` here
    await this.utils.sleep(50);

    assert.strictEqual(
      currentURL(),
      `/entries/${entry.id}`,
      'should stay on index page until entry save'
    );

    await settled();
    assert.notStrictEqual(
      currentURL(),
      `/entries/${entry.id}`,
      'should transition after entry save'
    );
  });
});
