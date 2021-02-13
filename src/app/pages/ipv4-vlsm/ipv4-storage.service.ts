import { Inject, Injectable, Optional } from '@angular/core';
import { HotToastService } from '@ngneat/hot-toast';
import { StorageMap } from '@ngx-pwa/local-storage';
import { fromUnixTime, getUnixTime } from 'date-fns';
import { assign } from 'lodash-es';
import { of } from 'rxjs';
import { Observable } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { DelimitedString, Encodable } from 'src/app/core/helpers';
import { ParseIPv4Address, IPv4SubnetRequirements } from 'vlsm-tools';

export const isSubnetRequirementsValid = (r: IPv4SubnetRequirements): boolean => r.label && r.label.length > 0 && r.size && r.size > 0;
export interface Iv4RequirementsForm {
  majorNetwork: string;
  requirements: IPv4SubnetRequirements[];
}

export class Iv4Settings implements Encodable<Iv4Settings> {
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
   * Encodes the class as a base64 string using a custom format
   * unixTimestamp|majorNetwork|label:size|label:size...
   *
   * @returns Base64 String
   * @memberof Iv4Settings
   */
  public encode(): string {
    const output: DelimitedString = new DelimitedString('|');
    const dateString = getUnixTime(this.modified);
    output.add(dateString.toString());
    if (this.formData) {
      const { majorNetwork, requirements } = this.formData;
      if (majorNetwork) {
        output.add(majorNetwork);
      }

      if (requirements) {
        output.add(
          ...requirements
            .filter((r) => isSubnetRequirementsValid(r))
            .map((r) => new DelimitedString(':', r.label, r.size.toString()).encode())
        );
      }
    }

    return btoa(output.encode());
  }

  /**
   * Decodes a Base64 string created by encoding a class
   *
   * @static
   * @param input Input base64 string
   * @returns Parsed settings class
   * @memberof Iv4Settings
   */
  public decode(input: string): Iv4Settings {
    /**
     * Things to check
     *
     * Should contain '|'
     * Should start with a valid unix time
     * Should have a major network
     */
    // Decode incoming base64
    const decoded = atob(input);
    if (decoded.startsWith('v6')) {
      throw new Error('This looks like a IPv6 string!');
    }

    const { parts } = DelimitedString.decode(decoded, '|');
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

    const majorNetwork: string = parts[1];
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
          const { parts: p } = DelimitedString.decode(r, ':');
          const label: string = p[0];
          const size: number = parseInt(p[1], 10);
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

    assign(this, out);
    return this;
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
      return new Iv4Settings().decode(s);
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
    const str = settings.encode();
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
