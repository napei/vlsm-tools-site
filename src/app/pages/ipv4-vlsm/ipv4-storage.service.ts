import { Inject, Injectable, Optional } from '@angular/core';
import { HotToastService } from '@ngneat/hot-toast';
import { StorageMap } from '@ngx-pwa/local-storage';
import { fromUnixTime, getUnixTime } from 'date-fns';
import { of } from 'rxjs';
import { Observable } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ParseIPv4Address, IPv4SubnetRequirements } from 'vlsm-tools';

export const isSubnetRequirementsValid = (r: IPv4SubnetRequirements): boolean => r.label && r.label.length > 0 && r.size && r.size > 0;
export interface Iv4RequirementsForm {
  majorNetwork: string;
  requirements: IPv4SubnetRequirements[];
}

export class Iv4Settings {
  public modified: Date;
  public formData: Iv4RequirementsForm;

  constructor() {
    this.modified = new Date();
    this.formData = {
      majorNetwork: '192.168.1.0/24',
      requirements: [
        { label: '', size: null },
        { label: '', size: null },
        { label: '', size: null },
        { label: '', size: null },
      ],
    };
  }

  /**
   * Decodes a Base64 string created by encoding a class
   *
   * @static
   * @param data Input base64 string
   * @returns Parsed settings class
   * @memberof Iv4Settings
   */
  public static decodeBase64(data: string): Iv4Settings {
    /**
     * Things to check
     *
     * Should contain '|'
     * Should start with a valid unix time
     * Should have a major network
     */
    // Decode incoming base64
    const decoded = atob(data);
    if (decoded.indexOf('|') === -1) {
      throw new Error('Input string does not contain pipe delimiter');
    }

    const parts = decoded.split('|');
    if (parts.length < 1) {
      throw new Error('Not enough parts to decode');
    }

    let datePart: number;

    try {
      datePart = parseInt(parts[0], 10);
    } catch (e) {
      throw new Error('Unable to parse int');
    }

    let modifiedDate: Date;
    try {
      modifiedDate = fromUnixTime(datePart);
    } catch (e) {
      throw new Error('Invalid date format');
    }

    const majorNetwork: string = decodeURIComponent(parts[1]);
    if (!ParseIPv4Address(majorNetwork)) {
      throw new Error('Invalid major address');
    }
    // Remove first two parts
    parts.shift();
    parts.shift();
    let requirements: IPv4SubnetRequirements[];
    if (parts.length > 0) {
      // Requirements
      requirements = parts.map((r: string) => {
        try {
          const sub: string[] = r.split(':');
          const label: string = decodeURIComponent(sub[0]);
          const size: number = parseInt(sub[1], 10);
          return { label, size };
        } catch (e) {
          throw new Error('Error while parsing requirements');
        }
      });
    }
    const out = new Iv4Settings();
    out.modified = modifiedDate;
    if (!requirements) {
      requirements = [
        { label: '', size: null },
        { label: '', size: null },
        { label: '', size: null },
        { label: '', size: null },
      ];
    }
    out.formData = { majorNetwork, requirements };

    return out;
  }

  /**
   * Encodes the class as a base64 string using a custom format
   * unixTimestamp|majorNetwork|label:size|label:size...
   *
   * @returns Base64 String
   * @memberof Iv4Settings
   */
  public encodeBase64(): string {
    const output: any[] = [];
    const dateString = getUnixTime(this.modified);
    output.push(dateString);
    if (this.formData) {
      const majorNetwork = encodeURIComponent(this.formData.majorNetwork);
      const reqs = this.formData.requirements
        .filter((r) => isSubnetRequirementsValid(r))
        .map((r) => `${encodeURIComponent(r.label)}:${r.size}`);

      if (majorNetwork) {
        output.push(majorNetwork);
      }
      if (reqs) {
        output.push(...reqs);
      }
    }

    return btoa(output.join('|'));
  }
}

@Injectable()
export class IPv4StorageService {
  private key = 'vlsm-v4';

  private parseMap = map((s: string) => {
    if (!s) {
      return new Iv4Settings();
    }
    try {
      const settings = Iv4Settings.decodeBase64(s);
      return settings;
    } catch (e) {
      this.toast.error('Invalid config detected in browser storage. Please reset.');
      return null;
    }
  });

  constructor(private storage: StorageMap, private toast: HotToastService) {}

  public get(): Observable<Iv4Settings | null> {
    return this.storage.get(this.key, { type: 'string' }).pipe(this.parseMap);
  }

  public set(settings: Iv4Settings): void {
    const str = settings.encodeBase64();
    this.storage.set(this.key, str).subscribe({
      next: () => {},
      error: (e) => {
        this.toast.error('Unable to save to browser storage');
        console.error(e);
      },
    });
  }

  public get watch$(): Observable<Iv4Settings> {
    return this.storage.watch(this.key).pipe(this.parseMap);
  }

  public delete(): void {
    this.storage.delete(this.key);
  }
}
