import { module, test } from 'qunit';
import { visit, currentURL, click, fillIn, typeIn } from '@ember/test-helpers';
import { setupApplicationTest } from 'ember-qunit';
import { setupMirage } from 'ember-cli-mirage/test-support';
import moment from 'moment';

import { setupUtils } from '../../utils/setup';

module('Acceptance | Entry > Page', function (hooks) {
  setupApplicationTest(hooks);
  setupMirage(hooks);
  setupUtils(hooks);

  test('redirects to login when not authenticated', async function (assert) {
    const entry = this.server.create('entry');
    await visit(`/entries/${entry.id}`);
    assert.strictEqual(currentURL(), '/login', 'should redirect to login');
  });

  test('redirects to login when a session token is stored in cookies but is invalid', async function (assert) {
    const entry = this.server.create('entry');
    document.cookie = 'token=invalid; path=/';
    await visit(`/entries/${entry.id}`);
    assert.strictEqual(currentURL(), '/login', 'should redirect to login');
  });

  test('remains on entry when a valid session token is stored in cookies', async function (assert) {
    const user = await this.utils.authentication.authenticate();
    const entry = this.server.create('entry', { user });
    await visit(`/entries/${entry.id}`);
    assert.strictEqual(currentURL(), `/entries/${entry.id}`, 'should remains on show entry');
  });

  test('updates entry title', async function (assert) {
    const user = await this.utils.authentication.authenticate();
    const entry = this.server.create('entry', { user });

    await visit(`/entries/${entry.id}`);
    await click(`[data-test-entry="${entry.id}"] [data-test-entry-title]`);

    assert
      .dom(`[data-test-entry="${entry.id}"] [data-test-entry-edit-title]`)
      .exists('should show title edit');
    await fillIn(
      `[data-test-entry="${entry.id}"] [data-test-entry-edit-title]`,
      'My new entry title'
    );
    await click('[data-test-header]');

    entry.reload();
    assert.strictEqual(
      entry.title,
      'My new entry title',
      'should update entry title'
    );
  });

  test('updates project', async function (assert) {
    const user = await this.utils.authentication.authenticate();
    const entry = this.server.create('entry', { user });

    this.server.create('project', { name: 'Tactic' });

    await visit(`/entries/${entry.id}`);
    await click(`[data-test-entry="${entry.id}"] [data-test-entry-project]`);

    assert
      .dom(`[data-test-entry="${entry.id}"] [data-test-entry-edit-project]`)
      .exists('should show project edit');
    await typeIn(
      `[data-test-entry="${entry.id}"] [data-test-entry-edit-project]`,
      'Tacti'
    );

    assert
      .dom(
        `[data-test-entry="${entry.id}"] [data-test-entry-edit-project-choice]`
      )
      .exists('should show projects choice list');

    await click(
      `[data-test-entry="${entry.id}"] [data-test-entry-edit-project-choice]`
    );

    entry.reload();
    assert.strictEqual(
      entry.project.name,
      'Tactic',
      'should update entry project'
    );
  });

  test('updates started at and stopped at date', async function (assert) {
    const user = await this.utils.authentication.authenticate();
    const startedAt = moment()
      .startOf('day')
      .subtract(1, 'day')
      .add(5, 'h')
      .add(3, 'm');
    const stoppedAt = moment()
      .startOf('day')
      .subtract(1, 'day')
      .add(5, 'h')
      .add(5, 'm');
    const entry = this.server.create('entry', { startedAt, stoppedAt, user });

    await visit(`/entries/${entry.id}`);

    assert
      .dom(`[data-test-entry="${entry.id}"] [data-test-entry-edit-date]`)
      .exists('should show edit date action');
    await click(`[data-test-entry="${entry.id}"] [data-test-entry-edit-date]`);

    assert
      .dom(`[data-test-entry="${entry.id}"] .ui-datepicker-calendar`)
      .exists('should show datepicker calendar');
    assert
      .dom(`[data-test-entry="${entry.id}"] .ui-datepicker-today`)
      .exists('should show datepicker today');

    await click(`[data-test-entry="${entry.id}"] .ui-datepicker-today a`);

    entry.reload();
    assert.strictEqual(
      entry.startedAt,
      moment(startedAt).dayOfYear(moment().dayOfYear()).toISOString(),
      'should update entry started at'
    );
    assert.strictEqual(
      entry.stoppedAt,
      moment(stoppedAt).dayOfYear(moment().dayOfYear()).toISOString(),
      'should update entry stopped at'
    );
  });

  test('deletes entry', async function (assert) {
    const user = await this.utils.authentication.authenticate();
    this.server.create('entry', { user });
    const entry = this.server.create('entry', { user });

    await visit(`/entries/${entry.id}`);
    assert
      .dom(`[data-test-entry="${entry.id}"] [data-test-entry-delete]`)
      .exists('should show delete action');

    await click(`[data-test-entry="${entry.id}"] [data-test-entry-delete]`);
    assert.strictEqual(currentURL(), '/', 'should redirect to index');
    assert.notOk(this.server.db.entries.find(entry.id), 'should destroy entry');
  });

});
