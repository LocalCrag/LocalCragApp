import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideTransloco } from '@jsverse/transloco';
import { InstancePickerComponent } from './instance-picker.component';
import { RUNTIME_API_HOST } from '../../../services/core/runtime-api-host';

describe('InstancePickerComponent', () => {
  let fixture: ComponentFixture<InstancePickerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InstancePickerComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: RUNTIME_API_HOST, useValue: 'http://10.0.2.2:5000' },
        provideTransloco({
          config: {
            availableLangs: ['en'],
            defaultLang: 'en',
            reRenderOnLangChange: true,
          },
        }),
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(InstancePickerComponent);
    fixture.detectChanges();
  });

  it('creates', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });
});
