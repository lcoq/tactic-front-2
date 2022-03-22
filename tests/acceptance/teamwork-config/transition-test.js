import { module, test } from 'qunit';
import { visit, currentURL, click, fillIn, settled } from '@ember/test-helpers';
import { setupApplicationTest } from 'ember-qunit';
import { setupMirage } from 'ember-cli-mirage/test-support';
import { Response } from 'miragejs';

import { setupUtils } from '../../utils/setup';

module('Acceptance | Teamwork > Transition', function (hooks) {
  setupApplicationTest(hooks);
  setupMirage(hooks);
  setupUtils(hooks);

  test('waits for domain edit to save before transition', async function (assert) {
    this.utils.stubs.stubForNativeTimeoutOn(
      'mutable-record-state-manager:save'
    );

    const user = this.server.create('user', 'withTeamwork');
    const domain = this.server.create('teamwork/domain', { user });
    await this.utils.authentication.authenticate(user);

    this.server.patch('/teamwork/domains/:id', 'teamwork/domains', {
      timing: 100,
    });

    await visit('/teamwork/config');

    await click(
      `[data-test-domain="${domain.id}"] [data-test-domain-name-container]`
    );
    await fillIn(
      `[data-test-domain="${domain.id}"] [data-test-domain-edit-name]`,
      'new-domain-name'
    );

    click('[data-test-header]'); // do not await here
    await this.utils.sleep(20);

    click('[data-test-reviews-link]'); // do not `await` here
    await this.utils.sleep(50);

    assert.strictEqual(
      currentURL(),
      '/teamwork/config',
      'should stay until client save'
    );

    await settled();
    assert.notStrictEqual(
      currentURL(),
      '/teamwork/config',
      'should transition after save'
    );
  });

  test('waits for domain delete to save before transition', async function (assert) {
    this.utils.stubs.stubForNativeTimeoutOn(
      'mutable-record-state-manager:delete'
    );

    const user = this.server.create('user', 'withTeamwork');
    const domain = this.server.create('teamwork/domain', { user });
    await this.utils.authentication.authenticate(user);

    this.server.delete('/teamwork/domains/:id', 'teamwork/domains', {
      timing: 100,
    });

    await visit('/teamwork/config');

    click(`[data-test-domain="${domain.id}"] [data-test-domain-delete]`); // do not await here

    click('[data-test-reviews-link]'); // do not `await` here
    await this.utils.sleep(50);

    assert.strictEqual(
      currentURL(),
      '/teamwork/config',
      'should stay until client save'
    );

    await settled();
    assert.notStrictEqual(
      currentURL(),
      '/teamwork/config',
      'should transition after save'
    );
  });

  test('asks for revert before transition when a domain is invalid and remains here without confirm', async function (assert) {
    assert.expect(3);

    const user = this.server.create('user', 'withTeamwork');
    const domain = this.server.create('teamwork/domain', { user });
    await this.utils.authentication.authenticate(user);

    this.utils.stubs.stub(window, 'confirm', () => {
      assert.ok(true);
      return false;
    });

    await visit('/teamwork/config');

    await click(
      `[data-test-domain="${domain.id}"] [data-test-domain-name-container]`
    );
    await fillIn(
      `[data-test-domain="${domain.id}"] [data-test-domain-edit-name]`,
      ''
    );

    await click('[data-test-header]');
    await click('[data-test-reviews-link]');

    assert.strictEqual(
      currentURL(),
      '/teamwork/config',
      'should not transition'
    );

    assert.strictEqual(
      this.server.pretender.handledRequests.filterBy('method', 'PATCH').length,
      0,
      'should not send PATCH client'
    );
  });

  test('asks for revert before transition when a domain is invalid then revert and transition after confirm', async function (assert) {
    assert.expect(3);

    const user = this.server.create('user', 'withTeamwork');
    const domain = this.server.create('teamwork/domain', { user });
    await this.utils.authentication.authenticate(user);

    this.utils.stubs.stub(window, 'confirm', () => {
      assert.ok(true);
      return true;
    });

    await visit('/teamwork/config');

    await click(
      `[data-test-domain="${domain.id}"] [data-test-domain-name-container]`
    );
    await fillIn(
      `[data-test-domain="${domain.id}"] [data-test-domain-edit-name]`,
      ''
    );

    await click('[data-test-header]');
    await click('[data-test-reviews-link]');

    assert.notStrictEqual(
      currentURL(),
      '/teamwork/config',
      'should transition'
    );

    assert.strictEqual(
      this.server.pretender.handledRequests.filterBy('method', 'PATCH').length,
      0,
      'should not send PATCH client'
    );
  });

  test('retry errored domain and waits for it before transition', async function (assert) {
    const user = this.server.create('user', 'withTeamwork');
    const domain = this.server.create('teamwork/domain', { user });
    await this.utils.authentication.authenticate(user);

    await visit('/teamwork/config');

    this.server.patch('/teamwork/domains/:id', () => new Response(500, {}, {}));

    await click(
      `[data-test-domain="${domain.id}"] [data-test-domain-name-container]`
    );
    await fillIn(
      `[data-test-domain="${domain.id}"] [data-test-domain-edit-name]`,
      'new-domain-name'
    );
    await click('[data-test-header]');

    assert
      .dom(`[data-test-domain="${domain.id}"] [data-test-domain-retry]`)
      .exists('should show retry action');

    this.utils.stubs.stubForNativeTimeoutOn(
      'mutable-record-state-manager:save'
    );

    this.server.patch('/teamwork/domains/:id', 'teamwork/domains', {
      timing: 100,
    });

    click('[data-test-reviews-link]'); // do not `await` here
    await this.utils.sleep(20);

    assert.strictEqual(
      currentURL(),
      '/teamwork/config',
      'should stay until update'
    );

    await settled();
    assert.notStrictEqual(
      currentURL(),
      '/teamwork/config',
      'should transition after update'
    );
  });

  test('abort transition when domain cannot be saved', async function (assert) {
    assert.expect(3);

    this.utils.stubs.stub(window, 'alert', () => assert.ok(true));

    const user = this.server.create('user', 'withTeamwork');
    const domain = this.server.create('teamwork/domain', { user });
    await this.utils.authentication.authenticate(user);

    await visit('/teamwork/config');

    this.server.patch('/teamwork/domains/:id', () => new Response(500, {}, {}));

    await click(
      `[data-test-domain="${domain.id}"] [data-test-domain-name-container]`
    );
    await fillIn(
      `[data-test-domain="${domain.id}"] [data-test-domain-edit-name]`,
      'new-domain-name'
    );
    await click('[data-test-header]');

    assert
      .dom(`[data-test-domain="${domain.id}"] [data-test-domain-retry]`)
      .exists('should show retry action');

    await click('[data-test-reviews-link]');

    assert.strictEqual(currentURL(), '/teamwork/config', 'should stay');
  });
});
