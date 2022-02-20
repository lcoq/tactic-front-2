import { helper } from '@ember/component/helper';
import formatDuration from '../utils/format-duration';

export default helper(function formatDurationHelper(positional /*, named*/) {
  return formatDuration(positional);
});
