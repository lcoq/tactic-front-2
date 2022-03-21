import { attr, hasMany } from '@ember-data/model';
import moment from 'moment';
import formatDuration from '../utils/format-duration';

import BaseModel from './base-model';

export default class EntriesStatGroupModel extends BaseModel {
  @attr('string') title;
  @attr('string') nature;
  @hasMany entriesStats;

  get xNature() {
    return this.nature.split('/')[1];
  }

  get xNatureIsDay() {
    return this.xNature === 'day';
  }

  get xNatureIsMonth() {
    return this.xNature === 'month';
  }

  get yNature() {
    return this.nature.split('/')[0];
  }

  get yNatureIsMonth() {
    return this.yNature === 'hour';
  }

  get chartData() {
    return this.entriesStats.map((stat) => {
      return {
        x: stat.date,
        y: moment.duration(stat.duration, 'seconds').as('hour'),
      };
    });
  }

  get chartScales() {
    return {
      x: this._xChartScale,
      y: this._yChartScale,
    };
  }

  get tooltip() {
    let self = this;
    return {
      callbacks: {
        title([context]) {
          const date = moment(context.raw.x);
          return self.xNatureIsDay
            ? date.format('D MMMM YYYY')
            : date.format('MMMM YYYY');
        },
        label(context) {
          const value = context.raw.y;
          const valueInSeconds = moment.duration(value, 'hour').as('seconds');
          return formatDuration(valueInSeconds);
        },
      },
    };
  }

  get _xChartScale() {
    if (this.xNatureIsDay) {
      return {
        type: 'time',
        time: {
          unit: 'day',
          displayFormats: {
            day: 'DD/MM',
          },
          round: 'day',
        },
      };
    } else if (this.xNatureIsMonth) {
      return {
        type: 'time',
        time: {
          unit: 'month',
          round: 'month',
        },
      };
    } else {
      return {};
    }
  }

  get _yChartScale() {
    return {
      type: 'linear',
      ticks: {
        precision: 1,
        callback(value) {
          return `${value}h`;
        },
      },
    };
  }
}
