import Component from '@glimmer/component';
import palette from 'google-palette';

export default class ShowChartComponent extends Component {
  get title() {
    return this.args.title;
  }

  get scales() {
    return this.args.scales;
  }

  get tooltip() {
    return this.args.tooltip;
  }

  get data() {
    return this.args.data;
  }

  get colors() {
    const type = this.data.length > 65 ? 'tol-rainbow' : 'mpn65';
    return palette(type, this.data.length).map(function (color) {
      return `#${color}`;
    });
  }

  get chartOptions() {
    return {
      type: 'bar',
      options: {
        plugins: {
          legend: {
            display: false,
          },
          title: {
            display: true,
            text: this.title,
          },
          tooltip: this.tooltip,
        },
        scales: this.scales,
      },
      data: {
        datasets: [
          {
            data: this.data,
            backgroundColor: this.colors,
          },
        ],
      },
    };
  }
}
