import { Injectable } from '@angular/core';
import { HotToastService } from '@ngneat/hot-toast';
import { StorageMap } from '@ngx-pwa/local-storage';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Encodable } from 'src/app/core/helpers';

export interface Divisor {
  numSubnets: number;
  cidrSize: number;
}

export interface Iv6RequirementsForm {
  majorAddress: string;
  divisor: Divisor;
}

export class Iv6Settings implements Encodable<Iv6Settings> {
  public modified: Date;
  public formData: Iv6RequirementsForm;

  constructor() {
    this.modified = new Date();
    this.formData = {
      majorAddress: '2001:db8::/32',
      divisor: {
        numSubnets: 2,
        cidrSize: 8,
      },
    };
  }

  public encode(): string {
    const out = { modified: this.modified, formData: this.formData };
    // Just use JSON because it's small
    const str = JSON.stringify(out);
    return btoa(str);
  }

  public decode(input: string): Iv6Settings {
    const data = atob(input);
    const obj: { modified: Date; formData: Iv6RequirementsForm } = JSON.parse(data);
    if (obj.modified) {
      this.modified = obj.modified;
    } else {
      throw new Error('Missing modified date');
    }

    if (obj.formData) {
      this.formData = obj.formData;
    } else {
      throw new Error('Missing form data');
    }

    return this;
  }
}

@Injectable()
export class Ipv6StorageService {
  private key = 'vlsm-v6';

  private parseMap = map((s: string) => {
    if (!s) {
      return new Iv6Settings();
    }
    try {
      return new Iv6Settings().decode(s);
    } catch (e) {
      this.toast.error('Invalid config detected in browser storage. Please reset.');
      return null;
    }
  });

  constructor(private storage: StorageMap, private toast: HotToastService) {}

  public get(): Observable<Iv6Settings | null> {
    return this.storage.get(this.key, { type: 'string' }).pipe(this.parseMap);
  }

  public set(settings: Iv6Settings): void {
    const str = settings.encode();
    this.storage.set(this.key, str).subscribe({
      next: () => {},
      error: (e) => {
        this.toast.error('Unable to save to browser storage');
        console.error(e);
      },
    });
  }

  public get watch$(): Observable<Iv6Settings> {
    return this.storage.watch(this.key).pipe(this.parseMap);
  }

  public delete(): void {
    this.storage.delete(this.key);
  }
}
