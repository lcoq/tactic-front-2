import { module, test } from 'qunit';
import { visit, currentURL } from '@ember/test-helpers';
import { setupApplicationTest } from 'ember-qunit';
import { setupMirage } from 'ember-cli-mirage/test-support';
import moment from 'moment';
import { Chart } from 'chart.js';

import { setupUtils } from '../../utils/setup';
import mirageGetStatsRoute from '../../../mirage/routes/get-stats';

module('Acceptance | Stats > Page', function (hooks) {
  setupApplicationTest(hooks);
  setupMirage(hooks);
  setupUtils(hooks);

  test('redirects to login when not authenticated', async function (assert) {
    await visit('/stats');
    assert.strictEqual(currentURL(), '/login', 'should redirect to login');
  });

  test('redirects to login when a session token is stored in cookies but is invalid', async function (assert) {
    document.cookie = 'token=invalid; path=/';
    await visit('/stats');
    assert.strictEqual(currentURL(), '/login', 'should redirect to login');
  });

  test('remains on stats when a valid session token is stored in cookies', async function (assert) {
    await this.utils.authentication.authenticate();
    this.server.create('entries-stat-group', {
      nature: 'hour/day',
    });
    await visit('/stats');
    assert.strictEqual(currentURL(), '/stats', 'should remains on stats');
  });

  test('shows chart', async function (assert) {
    assert.expect(19);

    await this.utils.authentication.authenticate();

    const stats = [
      this.server.create('entries-stat', {
        date: moment().startOf('month'),
        duration: 2 * 60 * 60,
      }),
      this.server.create('entries-stat', {
        date: moment().startOf('month').add(1, 'd'),
        duration: 3 * 60 * 60,
      }),
      this.server.create('entries-stat', {
        date: moment().startOf('month').add(2, 'd'),
        duration: 4 * 60 * 60,
      }),
    ];

    const group = this.server.create('entries-stat-group', {
      title: 'Hour per day',
      nature: 'hour/day',
      entriesStats: stats,
    });

    this.server.get('/stats/daily', mirageGetStatsRoute.dailyFilters(group));

    await visit('/stats');

    assert.dom('[data-test-chart-canvas]').exists('should show chart canvas');

    assert.strictEqual(
      Object.keys(Chart.instances).length,
      1,
      'should show chart'
    );
    const chart = Object.values(Chart.instances)[0];

    assert.strictEqual(chart.config.type, 'bar', 'should show bar chart');
    assert.strictEqual(
      chart.config.options.plugins.title.text,
      'Hour per day',
      'should show chart title'
    );

    assert.strictEqual(
      chart.config.options.scales.x.type,
      'time',
      'should use time scale on X'
    );
    assert.strictEqual(
      chart.config.options.scales.x.time.unit,
      'day',
      'should use day unit on X'
    );
    assert.strictEqual(
      chart.config.options.scales.x.time.round,
      'day',
      'should round to day on X'
    );
    assert.strictEqual(
      chart.config.options.scales.x.time.displayFormats.day,
      'DD/MM',
      'should use DD/MM day format on X'
    );

    assert.strictEqual(
      chart.config.options.scales.y.type,
      'linear',
      'should use linear scale on Y'
    );
    assert.strictEqual(
      chart.config.options.scales.y.ticks.precision,
      1,
      'should use 1 decimal precision on Y'
    );

    assert.strictEqual(
      chart.config.data.datasets.length,
      1,
      'should have 1 dataset'
    );
    const chartData = chart.config.data.datasets[0].data;

    assert.strictEqual(
      chart.config.data.datasets[0].backgroundColor.length,
      stats.length,
      'should have 1 color by stat'
    );
    assert.strictEqual(
      chartData.length,
      stats.length,
      'should have 1 data by stat'
    );

    stats.forEach((stat, index) => {
      assert.strictEqual(
        moment(chartData[index].x).toString(),
        stat.date.toString(),
        `should set stat ${index + 1} date`
      );
      assert.strictEqual(
        chartData[index].y,
        stat.duration / 60 / 60,
        `should set stat ${index + 1} duration in hour`
      );
    });
  });
});
