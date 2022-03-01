import { module, test } from 'qunit';
import { visit, currentURL, findAll } from '@ember/test-helpers';
import { setupApplicationTest } from 'ember-qunit';
import { setupMirage } from 'ember-cli-mirage/test-support';
import moment from 'moment';

import { setupUtils } from '../../utils/setup';
import mirageGetEntriesRoute from '../../../mirage/routes/get-entries';

module('Acceptance | Reviews > Page', function (hooks) {
  setupApplicationTest(hooks);
  setupMirage(hooks);
  setupUtils(hooks);

  test('redirects to login when not authenticated', async function (assert) {
    await visit('/reviews');
    assert.strictEqual(currentURL(), '/login', 'should redirect to login');
  });

  test('redirects to login when a session token is stored in cookies but is invalid', async function (assert) {
    document.cookie = 'token=invalid; path=/';
    await visit('/reviews');
    assert.strictEqual(currentURL(), '/login', 'should redirect to login');
  });

  test('remains on reviews when a valid session token is stored in cookies', async function (assert) {
    await this.utils.authentication.authenticate();
    await visit('/reviews');
    assert.strictEqual(currentURL(), '/reviews', 'should remains on reviews');
  });

  test('shows current month user entries by default', async function (assert) {
    assert.expect(137);

    const user = await this.utils.authentication.authenticate();
    const otherUser = this.server.create('user');

    const beginningOfMonth = moment()
      .startOf('month')
      .hours(0)
      .minutes(0)
      .seconds(0);

    const clientLorem = this.server.create('client', { name: 'Lorem' });
    const projectIpsum = this.server.create('project', {
      name: 'Ipsum',
      client: clientLorem,
    });

    const clientProductivity = this.server.create('client', {
      name: 'Productivity',
    });
    const projectTactic = this.server.create('project', {
      name: 'Tactic',
      client: clientProductivity,
    });
    const projectTictac = this.server.create('project', {
      name: 'Tictac',
      client: clientProductivity,
    });

    const projectOther = this.server.create('project', { name: 'Other' });

    const expectedEntries = [
      this.server.create('entry', {
        user,
        project: projectTactic,
        title: 'Debugging Tactic',
        startedAt: moment(beginningOfMonth).add(1, 'h'),
        stoppedAt: moment(beginningOfMonth).add(2, 'h'),
      }),
      this.server.create('entry', {
        user,
        project: projectTactic,
        title: 'Deploying Tactic',
        startedAt: moment(beginningOfMonth).add(1, 'd').add(3, 'h'),
        stoppedAt: moment(beginningOfMonth)
          .add(1, 'd')
          .add(4, 'h')
          .add(15, 'm'),
      }),
      this.server.create('entry', {
        user,
        project: projectTactic,
        title: 'Prod testing Tactic',
        startedAt: moment(beginningOfMonth).add(2, 'd').add(5, 'h'),
        stoppedAt: moment(beginningOfMonth)
          .add(2, 'd')
          .add(5, 'h')
          .add(20, 'm'),
      }),

      this.server.create('entry', {
        user,
        project: projectTictac,
        title: 'Trying new project',
        startedAt: moment(beginningOfMonth).add(2, 'd').add(3, 'h'),
        stoppedAt: moment(beginningOfMonth)
          .add(2, 'd')
          .add(3, 'h')
          .add(55, 'm')
          .add(23, 's'),
      }),

      this.server.create('entry', {
        user,
        project: projectIpsum,
        title: 'Writing fake test',
        startedAt: moment(beginningOfMonth).add(5, 'd').add(7, 'h'),
        stoppedAt: moment(beginningOfMonth)
          .add(5, 'd')
          .add(7, 'h')
          .add(32, 'm')
          .add(12, 's'),
      }),

      this.server.create('entry', {
        user,
        project: null,
        title: 'Eating',
        startedAt: moment(beginningOfMonth).add(1, 'd').add(3, 'h'),
        stoppedAt: moment(beginningOfMonth)
          .add(1, 'd')
          .add(4, 'h')
          .add(15, 'm'),
      }),

      this.server.create('entry', {
        user,
        project: null,
        title: 'Resting',
        startedAt: moment(beginningOfMonth).add(2, 'd').add(6, 'h'),
        stoppedAt: moment(beginningOfMonth)
          .add(2, 'd')
          .add(6, 'h')
          .add(15, 'm'),
      }),

      this.server.create('entry', {
        user,
        project: projectOther,
        title: 'Sleeping',
        startedAt: moment(beginningOfMonth).add(3, 'd').add(6, 'h'),
        stoppedAt: moment(beginningOfMonth)
          .add(3, 'd')
          .add(14, 'h')
          .add(50, 'm')
          .add(15, 's'),
      }),
    ];

    this.server.get('entries', (schema, request) => {
      if (
        request.queryParams['filter[since]'] &&
        request.queryParams['filter[before]'] &&
        request.queryParams['filter[user-id]'] &&
        request.queryParams['filter[user-id]'].length == 1 &&
        request.queryParams['filter[user-id]'][0] === user.id
      ) {
        return schema.entries.find(expectedEntries.mapBy('id'));
      } else {
        return mirageGetEntriesRoute.default()(schema, request);
      }
    });

    /* entries not returned by filtered request */
    this.server.create('entry', {
      user,
      project: null,
      title: 'Old stuff',
      startedAt: moment(beginningOfMonth)
        .subtract(1, 'd')
        .add(1, 'd')
        .add(3, 'h'),
      stoppedAt: moment(beginningOfMonth)
        .subtract(1, 'd')
        .add(2, 'h')
        .add(4, 'h')
        .add(15, 'm'),
    });
    this.server.create('entry', {
      user: otherUser,
      project: projectTactic,
      startedAt: moment(beginningOfMonth).add(3, 'd').add(6, 'h'),
      stoppedAt: moment(beginningOfMonth).add(3, 'd').add(7, 'h'),
    });

    const expectedNoClient = {
      name: 'No client',
      duration: '10:20:15',
      projects: [
        {
          name: 'No project',
          duration: '01:30:00',
          entries: [
            {
              title: 'Resting',
              date: moment(beginningOfMonth).add(2, 'd').format('DD/MM'),
              duration: '00:15:00',
              startedAt: '6:00',
              stoppedAt: '6:15',
            },
            {
              title: 'Eating',
              date: moment(beginningOfMonth).add(1, 'd').format('DD/MM'),
              duration: '01:15:00',
              startedAt: '3:00',
              stoppedAt: '4:15',
            },
          ],
        },
        {
          name: 'Other',
          duration: '08:50:15',
          entries: [
            {
              title: 'Sleeping',
              date: moment(beginningOfMonth).add(3, 'd').format('DD/MM'),
              duration: '08:50:15',
              startedAt: '6:00',
              stoppedAt: '14:50',
            },
          ],
        },
      ],
    };

    const expectedClientLorem = {
      name: 'Lorem',
      duration: '00:32:12',
      projects: [
        {
          name: 'Ipsum',
          duration: '00:32:12',
          entries: [
            {
              title: 'Writing fake test',
              date: moment(beginningOfMonth).add(5, 'd').format('DD/MM'),
              duration: '00:32:12',
              startedAt: '7:00',
              stoppedAt: '7:32',
            },
          ],
        },
      ],
    };

    const expectedClientProductivity = {
      name: 'Productivity',
      duration: '03:30:23',
      projects: [
        {
          name: 'Tactic',
          duration: '02:35:00',
          entries: [
            {
              title: 'Prod testing Tactic',
              date: moment(beginningOfMonth).add(2, 'd').format('DD/MM'),
              duration: '00:20:00',
              startedAt: '5:00',
              stoppedAt: '5:20',
            },
            {
              title: 'Deploying Tactic',
              date: moment(beginningOfMonth).add(1, 'd').format('DD/MM'),
              duration: '01:15:00',
              startedAt: '3:00',
              stoppedAt: '4:15',
            },
            {
              title: 'Debugging Tactic',
              date: moment(beginningOfMonth).format('DD/MM'),
              duration: '01:00:00',
              startedAt: '1:00',
              stoppedAt: '2:00',
            },
          ],
        },
        {
          name: 'Tictac',
          duration: '00:55:23',
          entries: [
            {
              title: 'Trying new project',
              date: moment(beginningOfMonth).add(2, 'd').format('DD/MM'),
              duration: '00:55:23',
              startedAt: '3:00',
              stoppedAt: '3:55',
            },
          ],
        },
      ],
    };

    const expected = [
      expectedNoClient,
      expectedClientLorem,
      expectedClientProductivity,
    ];

    await visit('/reviews');

    assert
      .dom('[data-test-client-group]')
      .exists({ count: expected.length }, 'should show all clients group');
    const clientGroups = findAll('[data-test-client-group]');

    expected.forEach(function (clientAttributes, clientIndex) {
      const clientGroup = clientGroups[clientIndex];
      const clientGroupId = `client ${clientAttributes.name}`;
      const clientProjects = Array.from(
        clientGroup.querySelectorAll('[data-test-project-group]')
      );

      assert
        .dom(clientGroup.querySelector('[data-test-client-group-name]'))
        .exists(`${clientGroupId} should show its name`);
      assert
        .dom(clientGroup.querySelector('[data-test-client-group-name]'))
        .hasText(
          clientAttributes.name,
          `${clientGroupId} should show its name`
        );

      assert
        .dom(clientGroup.querySelector('[data-test-client-group-duration]'))
        .exists(`${clientGroupId} should show its duration`);
      assert
        .dom(clientGroup.querySelector('[data-test-client-group-duration]'))
        .hasText(
          clientAttributes.duration,
          `${clientGroupId} should show its duration`
        );

      assert.strictEqual(
        clientProjects.length,
        clientAttributes.projects.length,
        `${clientGroupId} should show its projects`
      );

      clientAttributes.projects.forEach(function (
        projectAttributes,
        projectIndex
      ) {
        const projectGroup = clientProjects[projectIndex];
        const projectGroupId = `${clientGroupId} > project ${projectAttributes.name}`;
        const projectEntries = Array.from(
          projectGroup.querySelectorAll('[data-test-entry]')
        );

        assert
          .dom(projectGroup.querySelector('[data-test-project-group-name]'))
          .exists(`${projectGroupId} should show project name`);
        assert
          .dom(projectGroup.querySelector('[data-test-project-group-name]'))
          .hasText(
            projectAttributes.name,
            `${projectGroupId} should show project name`
          );

        assert
          .dom(projectGroup.querySelector('[data-test-project-group-duration]'))
          .exists(`${projectGroupId} should show project duration`);
        assert
          .dom(projectGroup.querySelector('[data-test-project-group-duration]'))
          .hasText(
            projectAttributes.duration,
            `${projectGroupId} should show project duration`
          );

        assert.strictEqual(
          projectEntries.length,
          projectAttributes.entries.length,
          `${projectGroupId} should show its entries`
        );

        projectAttributes.entries.forEach(function (
          entryAttributes,
          entryIndex
        ) {
          const entry = projectEntries[entryIndex];
          const entryId = `${projectGroupId} > entry ${entryAttributes.title}`;

          assert
            .dom(entry.querySelector('[data-test-entry-title'))
            .exists(`${entryId} should show entry title`);
          assert
            .dom(entry.querySelector('[data-test-entry-title'))
            .hasText(
              entryAttributes.title,
              `${entryId} should compute entry title`
            );
          assert
            .dom(entry.querySelector('[data-test-entry-project]'))
            .exists(`${entryId} should show entry project`);
          assert
            .dom(entry.querySelector('[data-test-entry-project]'))
            .hasText(
              projectAttributes.name,
              `${entryId} should compute entry project`
            );
          assert
            .dom(entry.querySelector('[data-test-entry-duration]'))
            .exists(`${entryId} should show entry duration`);
          assert
            .dom(entry.querySelector('[data-test-entry-duration]'))
            .hasText(
              entryAttributes.duration,
              `${entryId} should compute entry duration`
            );
          assert
            .dom(entry.querySelector('[data-test-entry-started-at]'))
            .exists(`${entryId} should show entry started at`);
          assert
            .dom(entry.querySelector('[data-test-entry-started-at]'))
            .hasText(
              entryAttributes.startedAt,
              `${entryId} should compute entry started at`
            );
          assert
            .dom(entry.querySelector('[data-test-entry-stopped-at]'))
            .exists(`${entryId} should show entry stopped at`);
          assert
            .dom(entry.querySelector('[data-test-entry-stopped-at]'))
            .hasText(
              entryAttributes.stoppedAt,
              `${entryId} should compute entry stopped at`
            );
          assert
            .dom(entry.querySelector('[data-test-entry-date]'))
            .exists(`${entryId} should show entry date`);
          assert
            .dom(entry.querySelector('[data-test-entry-date]'))
            .hasText(
              entryAttributes.date,
              `${entryId} should compute entry date`
            );
        });
      });
    });
  });
});
