import { module, test } from 'qunit';
import { visit, find, click, triggerEvent } from '@ember/test-helpers';
import { setupApplicationTest } from 'ember-qunit';
import { setupMirage } from 'ember-cli-mirage/test-support';
import moment from 'moment';

import { setupUtils } from '../../utils/setup';
import mirageGetEntriesRoute from '../../../mirage/routes/get-entries';

module('Acceptance | Reviews > Filters', function (hooks) {
  setupApplicationTest(hooks);
  setupMirage(hooks);
  setupUtils(hooks);

  test('filters by current user by default', async function (assert) {
    const user = await this.utils.authentication.authenticate();
    const otherUser = this.server.create('user');

    const userEntry = this.server.create('entry', { user });
    const otherUserEntry = this.server.create('entry', { user: otherUser });

    this.server.get(
      'entries',
      mirageGetEntriesRoute.filters(
        [userEntry],
        (_, r) =>
          r.queryParams['filter[user-id]'].length === 1 &&
          r.queryParams['filter[user-id]'][0] === user.id
      )
    );

    await visit('/reviews');

    assert
      .dom(`[data-test-entry="${userEntry.id}"]`)
      .exists('should show user entry');
    assert
      .dom(`[data-test-entry="${otherUserEntry.id}"]`)
      .doesNotExist('should not show other users entry');

    assert
      .dom(`[data-test-filter-user="${user.id}"]`)
      .exists('should show current user filter');
    assert
      .dom(`[data-test-filter-user="${otherUser.id}"]`)
      .exists('should show other user filter');

    assert
      .dom(`[data-test-filter-user="${user.id}"]`)
      .isChecked('should have current user filter checked');
    assert
      .dom(`[data-test-filter-user="${otherUser.id}"]`)
      .isNotChecked('should not have other user filter checked');
  });

  test('filters by current month by default', async function (assert) {
    await this.utils.authentication.authenticate();

    const beginningOfMonth = moment().startOf('month');
    const endOfMonth = moment().endOf('month');

    const currentMonthEntry = this.server.create('entry', {
      startedAt: moment(beginningOfMonth).add(1, 'd').add(3, 'h'),
    });

    const previousMonthEntry = this.server.create('entry', {
      startedAt: moment(beginningOfMonth)
        .subtract(1, 'd')
        .add(1, 'd')
        .add(3, 'h'),
    });

    this.server.get(
      'entries',
      mirageGetEntriesRoute.filters(
        [currentMonthEntry],
        (_, r) =>
          moment(r.queryParams['filter[since]']).isSame(beginningOfMonth) &&
          moment(r.queryParams['filter[before]']).isSame(endOfMonth)
      )
    );

    await visit('/reviews');

    assert
      .dom(`[data-test-entry="${currentMonthEntry.id}"]`)
      .exists('should show current month entry');
    assert
      .dom(`[data-test-entry="${previousMonthEntry.id}"]`)
      .doesNotExist('should not show previous month entry');

    assert.dom(`[data-test-filter-since]`).exists('should show since filter');
    assert
      .dom(`[data-test-filter-since]`)
      .hasText(
        beginningOfMonth.format('YYYY/MM/DD'),
        'should set since filter to beginning of month'
      );

    assert.dom(`[data-test-filter-before]`).exists('should show before filter');
    assert
      .dom(`[data-test-filter-before]`)
      .hasText(
        endOfMonth.format('YYYY/MM/DD'),
        'should set before filter to end of month'
      );
  });

  test('filters with all clients & projects by default', async function (assert) {
    const user = await this.utils.authentication.authenticate();

    const client1 = this.server.create('client');
    const client1Project1 = this.server.create('project', { client: client1 });
    const client1Project2 = this.server.create('project', { client: client1 });

    const client2 = this.server.create('client');
    const client2Project1 = this.server.create('project', { client: client2 });

    const allProjects = [client1Project1, client1Project2, client2Project1];
    const allProjectIds = allProjects.mapBy('id');

    const entry = this.server.create('entry', {
      user,
      project: allProjects[0],
    });

    await visit('/reviews');

    this.server.get(
      'entries',
      mirageGetEntriesRoute.filters([entry], (_, r) =>
        r.queryParams['filter[project-id]'].filter(
          (id) => allProjectIds.includes(id).length === allProjects.length
        )
      )
    );

    assert
      .dom(`[data-test-entry]`)
      .exists({ count: 1 }, 'should show entry returned by the server');

    assert
      .dom(`[data-test-filter-client="${client1.id}"]`)
      .exists('should show client 1 filter');
    assert
      .dom(`[data-test-filter-client="${client1.id}"]`)
      .isChecked('should have client 1 filter checked');

    assert
      .dom(`[data-test-filter-project="${client1Project1.id}"]`)
      .exists('should show client 1 project 1 filter');
    assert
      .dom(`[data-test-filter-project="${client1Project1.id}"]`)
      .isChecked('should have client 1 project 1 filter checked');

    assert
      .dom(`[data-test-filter-project="${client1Project2.id}"]`)
      .exists('should show client 1 project 2 filter');
    assert
      .dom(`[data-test-filter-project="${client1Project2.id}"]`)
      .isChecked('should have client 1 project 2 filter checked');

    assert
      .dom(`[data-test-filter-client="${client2.id}"]`)
      .exists('should show client 2 filter');
    assert
      .dom(`[data-test-filter-client="${client2.id}"]`)
      .isChecked('should have client 2 filter checked');

    assert
      .dom(`[data-test-filter-project="${client2Project1.id}"]`)
      .exists('should show client 2 project 1 filter');
    assert
      .dom(`[data-test-filter-project="${client2Project1.id}"]`)
      .isChecked('should have client 2 project 1 filter checked');
  });

  test('filters by user', async function (assert) {
    const user = await this.utils.authentication.authenticate();
    const otherUser = this.server.create('user');

    const userEntry = this.server.create('entry', { user });
    const otherUserEntry = this.server.create('entry', { user: otherUser });

    await visit('/reviews');

    this.server.get(
      'entries',
      mirageGetEntriesRoute.filters(
        [otherUserEntry],
        (_, r) =>
          r.queryParams['filter[user-id]'].length === 1 &&
          r.queryParams['filter[user-id]'][0] === otherUser.id
      )
    );

    await click(`[data-test-filter-user="${otherUser.id}"]`);
    await click(`[data-test-filter-user="${user.id}"]`); // uncheck
    await triggerEvent(find('[data-test-filter-user-container]'), 'mouseleave');

    assert
      .dom(`[data-test-entry="${userEntry.id}"]`)
      .doesNotExist('should not show user entry');
    assert
      .dom(`[data-test-entry="${otherUserEntry.id}"]`)
      .exists('should show other user entry');

    this.server.get(
      'entries',
      mirageGetEntriesRoute.filters(
        [userEntry],
        (_, r) =>
          r.queryParams['filter[user-id]'].length === 1 &&
          r.queryParams['filter[user-id]'][0] === user.id
      )
    );

    await click(`[data-test-filter-user="${otherUser.id}"]`); // uncheck
    await click(`[data-test-filter-user="${user.id}"]`);
    await triggerEvent(find('[data-test-filter-user-container]'), 'mouseleave');

    assert
      .dom(`[data-test-entry="${userEntry.id}"]`)
      .exists('should show user entry');
    assert
      .dom(`[data-test-entry="${otherUserEntry.id}"]`)
      .doesNotExist('should not show other user entry');

    this.server.get(
      'entries',
      mirageGetEntriesRoute.filters(
        [userEntry, otherUserEntry],
        (_, r) => r.queryParams['filter[user-id]'].length === 2
      )
    );

    await click(`[data-test-filter-user="${otherUser.id}"]`); // uncheck
    await triggerEvent(find('[data-test-filter-user-container]'), 'mouseleave');

    assert
      .dom(`[data-test-entry="${userEntry.id}"]`)
      .exists('should show user entry');
    assert
      .dom(`[data-test-entry="${otherUserEntry.id}"]`)
      .exists('should also show other user entry');
  });
});
