import Service from '@ember/service';
import moment from 'moment';

export default class CookieStoreService extends Service {
  getCookie(key) {
    const regexp = new RegExp(`${key}=([^;]+);?`);
    const match = document.cookie.match(regexp);
    if (match && match[1]) {
      return decodeURIComponent(match[1]);
    }
  }

  setCookie(key, value) {
    const expires = moment().add(13, 'months').toDate().toUTCString();
    document.cookie = `${key}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/`;
    document.cookie = `${key}=${encodeURIComponent(
      value
    )}; expires=${expires}; path=/`;
  }
}
