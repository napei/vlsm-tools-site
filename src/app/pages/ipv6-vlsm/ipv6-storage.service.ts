import { Injectable } from '@angular/core';
import { HotToastService } from '@ngneat/hot-toast';
import { StorageMap } from '@ngx-pwa/local-storage';
import { fromUnixTime, getUnixTime } from 'date-fns';
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

declare type Iv6StorageFormat = [number | null, string | null, number | null, number | null];

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
    const out: Iv6StorageFormat = [
      getUnixTime(this.modified),
      this.formData.majorAddress,
      this.formData.divisor.numSubnets,
      this.formData.divisor.cidrSize,
    ];
    // Just use JSON because it's small
    const str = JSON.stringify(out);
    return btoa(str);
  }

  public decode(input: string): Iv6Settings {
    const data = atob(input);
    const obj: Iv6StorageFormat = JSON.parse(data);
    this.modified = fromUnixTime(obj[0]);

    this.formData = {
      majorAddress: obj[1],
      divisor: {
        numSubnets: obj[2],
        cidrSize: obj[3],
      },
    };

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
