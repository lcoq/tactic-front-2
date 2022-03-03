import { modifier } from 'ember-modifier';
import { next } from '@ember/runloop';

export default modifier(function onFocusOutClick(element, [callback]) {
  function clickElement(event) {
    if (
      !element.contains(event.target) &&
      !event.target.closest('.ui-datepicker-header')
    ) {
      callback();
    }
  }
  /* run on `next` in order to avoid the click that opens the entry edit to
     propagate here and directly close the edit */
  next(() => window.addEventListener('click', clickElement), 100);

  return () => window.removeEventListener('click', clickElement);
});
