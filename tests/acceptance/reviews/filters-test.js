import { module, test } from 'qunit';
import {
  visit,
  find,
  findAll,
  click,
  triggerEvent,
  fillIn,
  triggerKeyEvent,
} from '@ember/test-helpers';
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

  test('filters by project', async function (assert) {
    await this.utils.authentication.authenticate();

    const project = this.server.create('project');
    const otherProject = this.server.create('project');

    const noProjectEntry = this.server.create('entry');
    const projectEntry = this.server.create('entry', { project: project });
    const otherProjectEntry = this.server.create('entry', {
      project: otherProject,
    });

    await visit('/reviews');

    assert
      .dom(`[data-test-entry="${noProjectEntry.id}"]`)
      .exists('should show no project entry at start');
    assert
      .dom(`[data-test-entry="${projectEntry.id}"]`)
      .exists('should show project entry at start');
    assert
      .dom(`[data-test-entry="${otherProjectEntry.id}"]`)
      .exists('should show other project entry at start');

    this.server.get(
      'entries',
      mirageGetEntriesRoute.filters(
        [noProjectEntry, otherProjectEntry],
        (_, r) =>
          r.queryParams['filter[project-id]'].length === 2 &&
          r.queryParams['filter[project-id]'].includes(otherProject.id)
      )
    );

    await click(`[data-test-filter-project="${project.id}"]`); // uncheck
    await triggerEvent(
      find('[data-test-filter-project-container]'),
      'mouseleave'
    );

    assert
      .dom(`[data-test-entry="${noProjectEntry.id}"]`)
      .exists('should show no project entry');
    assert
      .dom(`[data-test-entry="${projectEntry.id}"]`)
      .doesNotExist('should no longer show project entry');
    assert
      .dom(`[data-test-entry="${otherProjectEntry.id}"]`)
      .exists('should show other project entry');

    this.server.get(
      'entries',
      mirageGetEntriesRoute.filters(
        [noProjectEntry, projectEntry],
        (_, r) =>
          r.queryParams['filter[project-id]'].length === 2 &&
          r.queryParams['filter[project-id]'].includes(project.id)
      )
    );

    await click(`[data-test-filter-project="${otherProject.id}"]`); // uncheck
    await click(`[data-test-filter-project="${project.id}"]`);
    await triggerEvent(
      find('[data-test-filter-project-container]'),
      'mouseleave'
    );

    assert
      .dom(`[data-test-entry="${noProjectEntry.id}"]`)
      .exists('should show no project entry');
    assert
      .dom(`[data-test-entry="${projectEntry.id}"]`)
      .exists('should show project entry');
    assert
      .dom(`[data-test-entry="${otherProjectEntry.id}"]`)
      .doesNotExist('should not show other project entry');

    this.server.get(
      'entries',
      mirageGetEntriesRoute.filters(
        [projectEntry, otherProjectEntry],
        (_, r) => r.queryParams['filter[project-id]'].length === 2
      )
    );

    await click(`[data-test-filter-project="0"]`); // uncheck
    await click(`[data-test-filter-project="${otherProject.id}"]`); // uncheck
    await triggerEvent(
      find('[data-test-filter-project-container]'),
      'mouseleave'
    );

    assert
      .dom(`[data-test-entry="${noProjectEntry.id}"]`)
      .doesNotExist('should no longer show no project entry');
    assert
      .dom(`[data-test-entry="${projectEntry.id}"]`)
      .exists('should show project entry');
    assert
      .dom(`[data-test-entry="${otherProjectEntry.id}"]`)
      .exists('should also show other project entry');
  });

  test('filters by minimum date', async function (assert) {
    const user = await this.utils.authentication.authenticate();
    const todayEntry = this.server.create('entry', {
      user,
      startedAt: moment().startOf('day').add(1, 'h'),
    });
    const yesterdayEntry = this.server.create('entry', {
      user,
      startedAt: moment().startOf('day').subtract(1, 'd'),
    });
    const tomorrowEntry = this.server.create('entry', {
      user,
      startedAt: moment().startOf('day').add(1, 'd'),
    });

    await visit('/reviews');
    await click(`[data-test-filter-since]`);

    assert
      .dom(`[data-test-filter-since] .ui-datepicker-calendar`)
      .exists('should show since datepicker calendar');
    assert
      .dom(`[data-test-filter-since] .ui-datepicker-today`)
      .exists('should show datepicker today');

    this.server.get(
      'entries',
      mirageGetEntriesRoute.filters(
        [todayEntry, tomorrowEntry],
        (_, r) =>
          r.queryParams['filter[since]'] ===
            moment().startOf('day').toISOString() &&
          r.queryParams['filter[before]'] ===
            moment().endOf('month').toISOString()
      )
    );

    await click(`[data-test-filter-since] .ui-datepicker-today a`);

    assert
      .dom(`[data-test-entry="${yesterdayEntry.id}"]`)
      .doesNotExist('should not show yesterday entry');
    assert
      .dom(`[data-test-entry="${todayEntry.id}"]`)
      .exists('should show today entry');
    assert
      .dom(`[data-test-entry="${tomorrowEntry.id}"]`)
      .exists('should show tomorrow entry');

    await click(`[data-test-filter-since]`);

    this.server.get(
      'entries',
      mirageGetEntriesRoute.filters(
        [tomorrowEntry],
        (_, r) =>
          r.queryParams['filter[since]'] ===
            moment().startOf('day').add(1, 'day').toISOString() &&
          r.queryParams['filter[before]'] ===
            moment().endOf('month').toISOString()
      )
    );

    const calendarDays = findAll(
      '[data-test-filter-since] .ui-datepicker-calendar td'
    );
    const todayIndex = calendarDays.findIndex((d) =>
      Array.from(d.classList).includes('ui-datepicker-today')
    );
    const tomorrowDay = calendarDays[todayIndex + 1];
    await click(tomorrowDay.querySelector('a'));

    assert
      .dom(`[data-test-entry="${yesterdayEntry.id}"]`)
      .doesNotExist('should not show yesterday entry');
    assert
      .dom(`[data-test-entry="${todayEntry.id}"]`)
      .doesNotExist('should no longer show today entry');
    assert
      .dom(`[data-test-entry="${tomorrowEntry.id}"]`)
      .exists('should show tomorrow entry');
  });

  test('filters by minimum date change the maximum date if anterior', async function (assert) {
    const user = await this.utils.authentication.authenticate();
    const todayEntry = this.server.create('entry', {
      user,
      startedAt: moment().startOf('day').add(1, 'h'),
    });
    const nextMonthEntry = this.server.create('entry', {
      user,
      startedAt: moment().startOf('month').add(2, 'd'),
    });

    await visit('/reviews');
    await click(`[data-test-filter-since]`);
    await click(`[data-test-filter-since] .ui-datepicker-next`);

    this.server.get(
      'entries',
      mirageGetEntriesRoute.filters(
        [nextMonthEntry],
        (_, r) =>
          moment()
            .startOf('month')
            .add(1, 'month')
            .isSame(r.queryParams['filter[since]']) &&
          moment()
            .startOf('month')
            .add(1, 'month')
            .endOf('day')
            .isSame(r.queryParams['filter[before]'])
      )
    );

    await click(
      `[data-test-filter-since] .ui-datepicker-calendar [data-date="1"]`
    );

    assert
      .dom(`[data-test-entry="${todayEntry.id}"]`)
      .doesNotExist('should no longer show today entry');
    assert
      .dom(`[data-test-entry="${nextMonthEntry.id}"]`)
      .exists('should show next month entry');

    assert
      .dom(`[data-test-filter-before]`)
      .hasText(
        moment().startOf('month').add(1, 'month').format('YYYY/MM/DD'),
        'should update before filter'
      );
  });

  test('closes filter by minimum date on maximum date filter click', async function (assert) {
    await this.utils.authentication.authenticate();
    await visit('/reviews');
    await click(`[data-test-filter-since]`);
    assert
      .dom(`[data-test-filter-since] .ui-datepicker-calendar`)
      .exists('should show since datepicker calendar');
    await click(`[data-test-filter-before]`);
    assert
      .dom(`[data-test-filter-since] .ui-datepicker-calendar`)
      .doesNotExist('should remove since datepicker calendar');
  });

  test('filters by maximum date', async function (assert) {
    const user = await this.utils.authentication.authenticate();
    const todayEntry = this.server.create('entry', {
      user,
      startedAt: moment().startOf('day').add(1, 'h'),
    });
    const previousMonthEntry = this.server.create('entry', {
      user,
      startedAt: moment().startOf('month').subtract(1, 'd'),
    });
    const nextMonthEntry = this.server.create('entry', {
      user,
      startedAt: moment().startOf('month').add(1, 'd'),
    });

    await visit('/reviews');
    await click(`[data-test-filter-before]`);

    assert
      .dom(`[data-test-filter-before] .ui-datepicker-calendar`)
      .exists('should show before datepicker calendar');
    assert
      .dom(`[data-test-filter-before] .ui-datepicker-today`)
      .exists('should show datepicker today');

    this.server.get(
      'entries',
      mirageGetEntriesRoute.filters(
        [todayEntry],
        (_, r) =>
          moment().startOf('month').isSame(r.queryParams['filter[since]']) &&
          moment().endOf('day').isSame(r.queryParams['filter[before]'])
      )
    );

    await click(`[data-test-filter-before] .ui-datepicker-today a`);

    assert
      .dom(`[data-test-entry="${previousMonthEntry.id}"]`)
      .doesNotExist('should not show previous month entry');
    assert
      .dom(`[data-test-entry="${todayEntry.id}"]`)
      .exists('should show today entry');
    assert
      .dom(`[data-test-entry="${nextMonthEntry.id}"]`)
      .doesNotExist('should not show next month entry');

    await click(`[data-test-filter-before]`);

    this.server.get(
      'entries',
      mirageGetEntriesRoute.filters(
        [nextMonthEntry],
        (_, r) =>
          moment().startOf('month').isSame(r.queryParams['filter[since]']) &&
          moment()
            .startOf('month')
            .add(1, 'month')
            .endOf('day')
            .isSame(r.queryParams['filter[before]'])
      )
    );

    await click(`[data-test-filter-before] .ui-datepicker-next`);
    await click(
      `[data-test-filter-before] .ui-datepicker-calendar [data-date="1"]`
    );

    assert
      .dom(`[data-test-entry="${previousMonthEntry.id}"]`)
      .doesNotExist('should not show previous month entry');
    assert
      .dom(`[data-test-entry="${todayEntry.id}"]`)
      .doesNotExist('should no longer show today entry');
    assert
      .dom(`[data-test-entry="${nextMonthEntry.id}"]`)
      .exists('should show next month entry');
  });

  test('filters by maximum date change the minimum date if anterior', async function (assert) {
    const user = await this.utils.authentication.authenticate();
    const todayEntry = this.server.create('entry', {
      user,
      startedAt: moment().startOf('day').add(1, 'h'),
    });
    const previousMonthEntry = this.server.create('entry', {
      user,
      startedAt: moment().startOf('month').subtract(1, 'month').add(2, 'd'),
    });

    await visit('/reviews');
    await click(`[data-test-filter-before]`);

    this.server.get(
      'entries',
      mirageGetEntriesRoute.filters(
        [previousMonthEntry],
        (_, r) =>
          moment()
            .startOf('month')
            .subtract(1, 'month')
            .add(19, 'd')
            .isSame(r.queryParams['filter[since]']) &&
          moment()
            .startOf('month')
            .subtract(1, 'month')
            .add(19, 'd')
            .endOf('day')
            .isSame(r.queryParams['filter[before]'])
      )
    );

    await click(`[data-test-filter-before] .ui-datepicker-prev`);
    await click(
      `[data-test-filter-before] .ui-datepicker-calendar [data-date="20"]`
    );

    assert
      .dom(`[data-test-entry="${todayEntry.id}"]`)
      .doesNotExist('should no longer show today entry');
    assert
      .dom(`[data-test-entry="${previousMonthEntry.id}"]`)
      .exists('should show previous month entry');

    assert
      .dom(`[data-test-filter-since]`)
      .hasText(
        moment()
          .startOf('month')
          .subtract(1, 'month')
          .add(19, 'd')
          .format('YYYY/MM/DD'),
        'should update since filter'
      );
  });

  test('closes filter by maximum date on minimum date filter click', async function (assert) {
    await this.utils.authentication.authenticate();
    await visit('/reviews');
    await click(`[data-test-filter-before]`);
    assert
      .dom(`[data-test-filter-before] .ui-datepicker-calendar`)
      .exists('should show before datepicker calendar');
    await click(`[data-test-filter-since]`);
    assert
      .dom(`[data-test-filter-before] .ui-datepicker-calendar`)
      .doesNotExist('should remove before datepicker calendar');
  });

  test('filters by query', async function (assert) {
    const user = await this.utils.authentication.authenticate();
    const entry = this.server.create('entry', { user });
    const otherEntry = this.server.create('entry', { user });

    await visit('/reviews');

    assert.dom(`[data-test-entry="${entry.id}"]`).exists('should show entry');
    assert
      .dom(`[data-test-entry="${otherEntry.id}"]`)
      .exists('should show other entry');

    this.server.get(
      'entries',
      mirageGetEntriesRoute.filters(
        [otherEntry],
        (_, r) => r.queryParams['filter[query]'] === 'My query'
      )
    );

    assert.dom('[data-test-filter-query]').exists('should show query input');

    await fillIn('[data-test-filter-query]', 'My query');
    await triggerKeyEvent('[data-test-filter-query]', 'keyup', 'Enter');

    assert
      .dom(`[data-test-entry="${entry.id}"]`)
      .doesNotExist('should no longer show entry');
    assert
      .dom(`[data-test-entry="${otherEntry.id}"]`)
      .exists('should still show other entry');
  });

  test('filters are updated after client or project creation', async function (assert) {
    await this.utils.authentication.authenticate();

    const client1 = this.server.create('client');
    this.server.create('project', { client: client1 });

    await visit('/reviews');

    assert
      .dom(`[data-test-filter-client]`)
      .exists({ count: 2 }, 'should show client 1 and no client filter');
    assert
      .dom(`[data-test-filter-project]`)
      .exists({ count: 2 }, 'should show project 1 and no project filter');

    await visit('/');

    const newClient = this.server.create('client');
    const newProject = this.server.create('project', { client: newClient });

    await visit('/reviews');

    assert
      .dom(`[data-test-filter-client="${newClient.id}"]`)
      .exists('should show new client filter');
    assert
      .dom(`[data-test-filter-client="${newClient.id}"]`)
      .isNotChecked('should keep previous client filters values');

    await click(`[data-test-filter-client="${newClient.id}"]`);
    await triggerEvent(
      find('[data-test-filter-client-container]'),
      'mouseleave'
    );

    assert
      .dom(`[data-test-filter-project="${newProject.id}"]`)
      .exists('should show new project filter');
  });
});
