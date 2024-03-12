import {CacheService, createCachedSource} from './cache.service';
import {of} from 'rxjs';
import {take} from 'rxjs/operators';

describe('CacheService', () => {

  const requestFactory = ()=> of(Date.now()).pipe(take(1));

  it('should cache a request when re-querying within the windowTime', (done) => {
    requestFactory();
    const cachedRequest = createCachedSource(requestFactory, 500);
    cachedRequest.subscribe(result => {
      setTimeout(()=>{
        cachedRequest.subscribe(result2 => {
          expect(result).toBe(result2);
          done();
        });
      }, 10);
    });
  });

  it('shouldn\'t cache a request when re-querying after the windowTime', (done) => {
    requestFactory();
    const cachedRequest = createCachedSource(requestFactory, 5);
    cachedRequest.subscribe((result) => {
      setTimeout(()=>{
        cachedRequest.subscribe(result2 => {
          expect(result2).toBeGreaterThan(+result);
          done();
        });
      }, 10);
    });
  });

});
