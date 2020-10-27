import { Component } from '@angular/core';
import { Angulartics2GoogleGlobalSiteTag } from 'angulartics2/gst';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styles: [],
})
export class AppComponent {
  title = 'vlsm-tools-site';
  constructor(private angulartics: Angulartics2GoogleGlobalSiteTag) {
    this.angulartics.startTracking();
  }
}
