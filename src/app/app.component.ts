import { Component } from '@angular/core';
import { Angulartics2GoogleGlobalSiteTag } from 'angulartics2/gst';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styles: [],
})
export class AppComponent {
  constructor(private tracking: Angulartics2GoogleGlobalSiteTag) {
    this.tracking.startTracking();
  }
}
