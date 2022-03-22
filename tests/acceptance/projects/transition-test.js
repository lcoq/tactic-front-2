import { module, test } from 'qunit';
import { visit, currentURL, click, fillIn, settled } from '@ember/test-helpers';
import { setupApplicationTest } from 'ember-qunit';
import { setupMirage } from 'ember-cli-mirage/test-support';

import { setupUtils } from '../../utils/setup';

module('Acceptance | Projects > Transition', function (hooks) {
  setupApplicationTest(hooks);
  setupMirage(hooks);
  setupUtils(hooks);

  test('waits for client edit to save before transition', async function (assert) {
    this.utils.stubs.stubForNativeTimeoutOn(
      'mutable-record-state-manager:save'
    );

    await this.utils.authentication.authenticate();
    const client = this.server.create('client');

    this.server.patch('/clients/:id', { timing: 100 });

    await visit('/projects');

    await click(`[data-test-client="${client.id}"] [data-test-client-name]`);
    await fillIn(
      `[data-test-client="${client.id}"] [data-test-client-edit-name]`,
      'My new client name'
    );
    click('[data-test-header]'); // do not await here
    await this.utils.sleep(20);

    click('[data-test-reviews-link]'); // do not `await` here
    await this.utils.sleep(50);

    assert.strictEqual(
      currentURL(),
      '/projects',
      'should stay on projects page until client save'
    );

    await settled();
    assert.notStrictEqual(
      currentURL(),
      '/projects',
      'should transition after client save'
    );
  });

  test('ask for revert before transition when a client is invalid and remains on projects without confirm', async function (assert) {
    assert.expect(3);

    await this.utils.authentication.authenticate();
    const client = this.server.create('client');

    await visit('/projects');

    this.utils.stubs.stub(window, 'confirm', () => {
      assert.ok(true);
      return false;
    });

    await click(`[data-test-client="${client.id}"] [data-test-client-name]`);
    await fillIn(
      `[data-test-client="${client.id}"] [data-test-client-edit-name]`,
      ''
    );
    await click('[data-test-header]');
    await click('[data-test-reviews-link]');

    assert.strictEqual(
      currentURL(),
      '/projects',
      'should stay on projects page'
    );

    assert.strictEqual(
      this.server.pretender.handledRequests.filterBy('method', 'PATCH').length,
      0,
      'should not send PATCH client'
    );
  });

  test('ask for revert before transition when a client is invalid then revert and transition after confirm', async function (assert) {
    assert.expect(3);

    await this.utils.authentication.authenticate();
    const client = this.server.create('client');

    await visit('/projects');

    this.utils.stubs.stub(window, 'confirm', () => {
      assert.ok(true);
      return true;
    });

    await click(`[data-test-client="${client.id}"] [data-test-client-name]`);
    await fillIn(
      `[data-test-client="${client.id}"] [data-test-client-edit-name]`,
      ''
    );
    await click('[data-test-header]');
    await click('[data-test-reviews-link]');

    assert.notStrictEqual(currentURL(), '/projects', 'should transition');

    assert.strictEqual(
      this.server.pretender.handledRequests.filterBy('method', 'PATCH').length,
      0,
      'should not send PATCH client'
    );
  });

  test('waits for project edit to save before transition', async function (assert) {
    this.utils.stubs.stubForNativeTimeoutOn(
      'mutable-record-state-manager:save'
    );

    await this.utils.authentication.authenticate();
    const project = this.server.create('project');

    this.server.patch('/projects/:id', { timing: 100 });

    await visit('/projects');

    await click(`[data-test-project="${project.id}"] [data-test-project-name]`);
    await fillIn(
      `[data-test-project="${project.id}"] [data-test-project-edit-name]`,
      'My new project name'
    );
    click('[data-test-header]'); // do not await here
    await this.utils.sleep(20);

    click('[data-test-reviews-link]'); // do not `await` here
    await this.utils.sleep(50);

    assert.strictEqual(
      currentURL(),
      '/projects',
      'should stay on projects page until project save'
    );

    await settled();
    assert.notStrictEqual(
      currentURL(),
      '/projects',
      'should transition after project save'
    );
  });

  test('ask for revert before transition when a project is invalid and remains on projects without confirm', async function (assert) {
    assert.expect(3);

    await this.utils.authentication.authenticate();
    const project = this.server.create('project');

    await visit('/projects');

    this.utils.stubs.stub(window, 'confirm', () => {
      assert.ok(true);
      return false;
    });

    await click(`[data-test-project="${project.id}"] [data-test-project-name]`);
    await fillIn(
      `[data-test-project="${project.id}"] [data-test-project-edit-name]`,
      ''
    );
    await click('[data-test-header]');
    await click('[data-test-reviews-link]');

    assert.strictEqual(
      currentURL(),
      '/projects',
      'should stay on projects page'
    );

    assert.strictEqual(
      this.server.pretender.handledRequests.filterBy('method', 'PATCH').length,
      0,
      'should not send PATCH project'
    );
  });

  test('ask for revert before transition when a project is invalid then revert and transition after confirm', async function (assert) {
    assert.expect(3);

    await this.utils.authentication.authenticate();
    const project = this.server.create('project');

    await visit('/projects');

    this.utils.stubs.stub(window, 'confirm', () => {
      assert.ok(true);
      return true;
    });

    await click(`[data-test-project="${project.id}"] [data-test-project-name]`);
    await fillIn(
      `[data-test-project="${project.id}"] [data-test-project-edit-name]`,
      ''
    );
    await click('[data-test-header]');
    await click('[data-test-reviews-link]');

    assert.notStrictEqual(currentURL(), '/projects', 'should transition');

    assert.strictEqual(
      this.server.pretender.handledRequests.filterBy('method', 'PATCH').length,
      0,
      'should not send PATCH project'
    );
  });
});
