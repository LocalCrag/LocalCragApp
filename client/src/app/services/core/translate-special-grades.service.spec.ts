import { TestBed } from '@angular/core/testing';
import { TranslateSpecialGradesService } from './translate-special-grades.service';
import { BehaviorSubject } from 'rxjs';
import { Store } from '@ngrx/store';
import { TranslocoService } from '@jsverse/transloco';
import { selectNoClosedProjects } from '../../ngrx/selectors/instance-settings.selectors';

describe('TranslateSpecialGradesService', () => {
  let service: TranslateSpecialGradesService;
  let noClosedProjects$: BehaviorSubject<boolean>;
  let transloco: jasmine.SpyObj<TranslocoService>;

  beforeEach(() => {
    noClosedProjects$ = new BehaviorSubject<boolean>(false);
    transloco = jasmine.createSpyObj('TranslocoService', ['translate']);
    transloco.translate.and.callFake(
      ((key: string) => key) as typeof transloco.translate,
    );

    const store = jasmine.createSpyObj('Store', ['select']);
    store.select.and.callFake((selector: unknown) => {
      if (selector === selectNoClosedProjects) {
        return noClosedProjects$.asObservable();
      }
      return noClosedProjects$.asObservable();
    });

    TestBed.configureTestingModule({
      providers: [
        TranslateSpecialGradesService,
        { provide: TranslocoService, useValue: transloco },
        { provide: Store, useValue: store },
      ],
    });

    service = TestBed.inject(TranslateSpecialGradesService);
  });

  it('translates OPEN_PROJECT and CLOSED_PROJECT distinctly when setting is off', () => {
    noClosedProjects$.next(false);
    expect(service.translate('OPEN_PROJECT')).toBe('OPEN_PROJECT');
    expect(service.translate('CLOSED_PROJECT')).toBe('CLOSED_PROJECT');
  });

  it('unifies OPEN_PROJECT and CLOSED_PROJECT to PROJECT when setting is on', () => {
    noClosedProjects$.next(true);
    expect(service.translate('OPEN_PROJECT')).toBe('PROJECT');
    expect(service.translate('CLOSED_PROJECT')).toBe('PROJECT');
  });

  it('keeps distinct labels when unifyProjects is false', () => {
    noClosedProjects$.next(true);
    expect(service.translate('OPEN_PROJECT', false)).toBe('OPEN_PROJECT');
    expect(service.translate('CLOSED_PROJECT', false)).toBe('CLOSED_PROJECT');
  });

  it('passes through normal grade names', () => {
    expect(service.translate('6A')).toBe('6A');
  });
});
