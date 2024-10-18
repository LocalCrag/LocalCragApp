import {Component, OnInit} from '@angular/core';

@Component({
  selector: 'lc-sentry-test',
  standalone: true,
  imports: [],
  templateUrl: './sentry-test.component.html',
  styleUrl: './sentry-test.component.scss',
})
export class SentryTestComponent implements OnInit {
  ngOnInit() {
    throw new Error('This is a test error');
  }
}
