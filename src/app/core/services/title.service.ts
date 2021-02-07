import { environment } from 'src/environments/environment';

import { Injectable } from '@angular/core';
import { Title } from '@angular/platform-browser';

@Injectable({
  providedIn: 'root',
})
export class TitleService {
  constructor(private title: Title) {
    this.set(null);
  }

  public set(i?: string): void {
    const t = `${i ? `${i} | ` : ''}${environment.appName}`;
    this.title.setTitle(t);
  }
}
