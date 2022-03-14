import { module, test } from 'qunit';
import { visit, currentURL, click, typeIn, fillIn } from '@ember/test-helpers';
import { setupApplicationTest } from 'ember-qunit';
import { setupMirage } from 'ember-cli-mirage/test-support';

import { setupUtils } from '../../utils/setup';

module('Acceptance | Index > Transition', function (hooks) {
  setupApplicationTest(hooks);
  setupMirage(hooks);
  setupUtils(hooks);

  test('waits for new entry to save before transition', async function (assert) {
    this.utils.stubs.stubCreateEntryClock();
    await this.utils.authentication.authenticate();

    this.server.post('/entries', { timing: 100 });

    await visit('/');

    click(`[data-test-start-entry]`); // do not `await` here
    await this.utils.sleep(20);

    assert.ok(
      this.owner.lookup('controller:index').newEntryIsPendingSave,
      'cannot perform test correctly as it expects the new entry to be pending save at this stage'
    );

    click('[data-test-reviews-link]'); // do not `await` here
    await this.utils.sleep(50);

    assert.strictEqual(
      currentURL(),
      '/',
      'should stay on index page until new entry save'
    );

    await click('[data-test-header]'); // `await` anything to wait end of run loops
    assert.notStrictEqual(
      currentURL(),
      '/',
      'should transition after new entry save'
    );
  });

  test('waits for new entry update before transition', async function (assert) {
    this.utils.stubs.stubCreateEntryClock();
    this.utils.stubs.stubForNativeTimeoutOn('running-entry-state-manager:save');
    await this.utils.authentication.authenticate();

    this.server.patch('/entries/:id', { timing: 100 });

    await visit('/');

    await click(`[data-test-start-entry]`);
    await typeIn(`[data-test-running-entry-title]`, 'E');

    assert.ok(
      this.owner.lookup('controller:index').newEntryIsPendingSave,
      'cannot perform test correctly as it expects the new entry to be pending save at this stage'
    );

    click('[data-test-reviews-link]'); // do not `await` here
    await this.utils.sleep(20);

    assert.strictEqual(
      currentURL(),
      '/',
      'should stay on index page until new entry update'
    );

    await click('[data-test-header]'); // `await` anything to wait end of run loops
    assert.notStrictEqual(
      currentURL(),
      '/',
      'should transition after new entry update'
    );
  });

  test('retry errored new entry and waits for it before transition', async function (assert) {
    this.utils.stubs.stubCreateEntryClock();
    this.utils.stubs.stubForNativeTimeoutOn('running-entry-state-manager:save');
    await this.utils.authentication.authenticate();

    await visit('/');

    this.server.post('/entries', () => new Response(500, {}, {}));

    await click(`[data-test-start-entry]`);

    assert.ok(
      this.owner.lookup('controller:index').newEntryIsSaveErrored,
      'cannot perform test correctly as it expects the new entry to be save errored at this stage'
    );

    this.server.post('/entries', { timing: 100 });

    click('[data-test-reviews-link]'); // do not `await` here
    await this.utils.sleep(20);

    assert.strictEqual(
      currentURL(),
      '/',
      'should stay on index page until new entry update'
    );

    await click('[data-test-header]'); // `await` anything to wait end of run loops
    assert.notStrictEqual(
      currentURL(),
      '/',
      'should transition after new entry update'
    );
  });

  test('abort transition when new entry cannot be saved', async function (assert) {
    assert.expect(3);

    this.utils.stubs.stubCreateEntryClock();
    this.utils.stubs.stubForNativeTimeoutOn('running-entry-state-manager:save');
    await this.utils.authentication.authenticate();

    await visit('/');

    this.server.post('/entries', () => new Response(500, {}, {}), {
      timing: 100,
    });

    await click(`[data-test-start-entry]`);

    assert.ok(
      this.owner.lookup('controller:index').newEntryIsSaveErrored,
      'cannot perform test correctly as it expects the new entry to be save errored at this stage'
    );

    this.utils.stubs.stub(window, 'alert', () => assert.ok(true));

    await click('[data-test-reviews-link]');
    await this.utils.sleep(20);

    assert.strictEqual(
      currentURL(),
      '/',
      'should stay on index page when new entry cannot be saved'
    );
  });

  test('waits for entry edit to save before transition', async function (assert) {
    this.utils.stubs.stubForNativeTimeoutOn(
      'mutable-record-state-manager:save'
    );

    const user = await this.utils.authentication.authenticate();
    this.server.create('entry', { user });

    this.server.patch('/entries/:id', { timing: 100 });

    await visit('/');

    await click(`[data-test-entry-title]`);
    await fillIn(`[data-test-entry-edit-title]`, 'My new title');
    click('[data-test-header]'); // do not await here
    await this.utils.sleep(20);

    click('[data-test-reviews-link]'); // do not `await` here
    await this.utils.sleep(50);

    assert.strictEqual(
      currentURL(),
      '/',
      'should stay on index page until entry save'
    );

    await click('[data-test-header]'); // `await` anything to wait end of run loops
    assert.notStrictEqual(
      currentURL(),
      '/',
      'should transition after entry save'
    );
  });

  test('stops entry edit on transition and wait it to save before transition', async function (assert) {
    this.utils.stubs.stubForNativeTimeoutOn(
      'mutable-record-state-manager:save'
    );

    const user = await this.utils.authentication.authenticate();
    this.server.create('entry', { user });

    this.server.patch('/entries/:id', { timing: 100 });

    await visit('/');

    await click(`[data-test-entry-title]`);
    await fillIn(`[data-test-entry-edit-title]`, 'My new title');

    click('[data-test-reviews-link]'); // do not `await` here
    await this.utils.sleep(50);

    assert.strictEqual(
      currentURL(),
      '/',
      'should stay on index page until entry save'
    );

    await click('[data-test-header]'); // `await` anything to wait end of run loops
    assert.notStrictEqual(
      currentURL(),
      '/',
      'should transition after entry save'
    );
  });

  test('waits for entry delete to save before transition', async function (assert) {
    this.utils.stubs.stubForNativeTimeoutOn(
      'mutable-record-state-manager:delete'
    );

    const user = await this.utils.authentication.authenticate();
    this.server.create('entry', { user });

    this.server.delete('/entries/:id', { timing: 100 });

    await visit('/');

    click(`[data-test-entry-delete]`); // do not await here

    click('[data-test-reviews-link]'); // do not `await` here
    await this.utils.sleep(50);

    assert.strictEqual(
      currentURL(),
      '/',
      'should stay on index page until entry save'
    );

    await click('[data-test-header]'); // `await` anything to wait end of run loops
    assert.notStrictEqual(
      currentURL(),
      '/',
      'should transition after entry save'
    );
  });

  test('retry errored entry and waits for it before transition', async function (assert) {
    this.utils.stubs.stubForNativeTimeoutOn(
      'mutable-record-state-manager:save'
    );

    const user = await this.utils.authentication.authenticate();
    this.server.create('entry', { user });

    await visit('/');

    this.server.patch('/entries/:id', () => new Response(500, {}, {}));

    await click(`[data-test-entry-title]`);
    await fillIn(`[data-test-entry-edit-title]`, 'My new title');
    await click('[data-test-header]');
    await this.utils.sleep(50);

    this.server.patch('/entries/:id', { timing: 100 });

    click('[data-test-reviews-link]'); // do not `await` here
    await this.utils.sleep(50);

    assert.strictEqual(
      currentURL(),
      '/',
      'should stay on index page until entry save'
    );

    await click('[data-test-header]'); // `await` anything to wait end of run loops
    assert.notStrictEqual(
      currentURL(),
      '/',
      'should transition after entry save'
    );
  });

  test('abort transition when an entry cannot be saved', async function (assert) {
    assert.expect(3);

    this.utils.stubs.stubForNativeTimeoutOn(
      'mutable-record-state-manager:save'
    );

    const user = await this.utils.authentication.authenticate();
    this.server.create('entry', { user });

    this.server.patch('/entries/:id', () => new Response(500, {}, {}));

    await visit('/');

    await click(`[data-test-entry-title]`);
    await fillIn(`[data-test-entry-edit-title]`, 'My new title');
    await click('[data-test-header]');

    this.utils.stubs.stub(window, 'alert', () => assert.ok(true));

    click('[data-test-reviews-link]'); // do not `await` here
    await this.utils.sleep(50);

    assert.strictEqual(
      currentURL(),
      '/',
      'should stay on index page until entry save'
    );

    await click('[data-test-header]'); // `await` anything to wait end of run loops
    assert.strictEqual(
      currentURL(),
      '/',
      'should stay on index page when entry cannot be saved'
    );
  });
});
