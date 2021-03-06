import { take, timeout } from 'rxjs/operators';

const takeLast = (stream$, wait = 30 * 1000) =>
  new Promise((resolve, reject) => {
    stream$
      .pipe(
        take(1),
        timeout(wait),
      )
      .subscribe(resolve, reject);
  });

export default takeLast;
