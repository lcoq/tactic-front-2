import { modifier } from 'ember-modifier';
import { Chart, registerables } from 'chart.js';
import 'chartjs-adapter-moment';

Chart.register(...registerables);

export default modifier(function chart(element, [options]) {
  const chart = new Chart(element, options);
  return () => chart.destroy();
});
