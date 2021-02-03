import { Injectable } from '@angular/core';
import { fromUnixTime, getUnixTime } from 'date-fns';
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

  public static decode(data: string): Iv4Settings {
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
    out.formData = { majorNetwork, requirements };

    return out;
  }

  // Returns base64 encoded representaiton of the class
  // Custom data format to save space
  // unixTimestamp|majorNetwork|label:size|label:size...
  public encode(): string {
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

  // Decodes a base64 string to a class.
}

const STORAGE_METHOD = localStorage;
const STORAGE_KEY = 'ipv4';

@Injectable()
export class Ipv4StorageService {
  constructor() {}

  public clearStorage(): void {
    STORAGE_METHOD.removeItem(STORAGE_KEY);
  }

  private loadStorage(): Iv4Settings {
    const storageItem = STORAGE_METHOD.getItem(STORAGE_KEY);
    if (!storageItem) {
      const newS = this.newSettings();
      this.saveStorage(newS);
      return newS;
    }

    try {
      const item = Iv4Settings.decode(storageItem);
      return item;
    } catch (error) {
      const newS = this.newSettings();
      this.saveStorage(newS);
      return newS;
    }
  }

  private newSettings(): Iv4Settings {
    const newSettings = new Iv4Settings();
    return newSettings;
  }

  private saveStorage(v: Iv4Settings) {
    const item = v?.encode();
    if (item) {
      STORAGE_METHOD.setItem(STORAGE_KEY, item);
    }
  }

  public get currentSettings(): Iv4Settings {
    return this.loadStorage();
  }

  public set currentSettings(v: Iv4Settings) {
    this.saveStorage(v);
  }

  public get base64Settings(): string {
    return this.currentSettings.encode();
  }

  public set base64Settings(s: string) {
    this.currentSettings = Iv4Settings.decode(s);
  }
}
