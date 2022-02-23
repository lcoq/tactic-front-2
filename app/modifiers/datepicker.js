import { modifier } from 'ember-modifier';
import moment from 'moment';

export default modifier(function datepicker(element, [initialDate, selectCallback], /*named*/) {
  const $element = $(element);
  $element.datepicker({
    firstDay: 1,
    dateFormat: 'yymmdd',
    prevText: '<',
    nextText: '>',
    showOtherMonths: true,
    selectOtherMonths: true,
    defaultDate: initialDate,
    onSelect: function (dateString) {
      const date = moment(dateString, 'YYYYMMDD').toDate();
      selectCallback(date);
    }
  });
  return () => { $element.datepicker('destroy') };
});
