import { Injectable } from '@angular/core';
import { fromUnixTime, getUnixTime } from 'date-fns';
import { BehaviorSubject } from 'rxjs';
import { SubnetRequirements } from 'vlsm-tools';

export function isSubnetRequirementsValid(r: SubnetRequirements): boolean {
  return r.label && r.label.length > 0 && r.size && r.size > 0;
}
export interface Iv4RequirementsForm {
  majorNetwork: string;
  requirements: SubnetRequirements[];
}

export class Iv4Settings {
  public modified: Date;
  public formData: Iv4RequirementsForm;

  constructor() {
    this.modified = new Date();
  }

  // Returns base64 encoded representaiton of the class
  // Custom data format to save space
  // unixTimestamp|majorNetwork|label:size|label:size...
  public encode(): string {
    let output: any[] = [];
    const dateString = getUnixTime(this.modified);
    output.push(dateString);
    if (this.formData) {
      const majorNetwork = encodeURIComponent(this.formData.majorNetwork);
      const reqs = this.formData.requirements
        .filter((r) => {
          return isSubnetRequirementsValid(r);
        })
        .map((r) => {
          return `${encodeURIComponent(r.label)}:${r.size}`;
        });

      if (majorNetwork) output.push(majorNetwork);
      if (reqs) output.push(...reqs);
    }

    return btoa(output.join('|'));
  }

  // Decodes a base64 string to a class.
  public static decode(data: string): Iv4Settings {
    const decoded = atob(data);
    const parts = decoded.split('|');
    if (parts.length < 1) return null;
    const modified: Date = fromUnixTime(parseInt(parts[0]));
    const majorNetwork: string = decodeURIComponent(parts[1]);
    // Remove first two parts
    parts.shift();
    parts.shift();
    // Requirements
    const requirements: SubnetRequirements[] = parts.map((r: string) => {
      const sub: string[] = r.split(':');
      const label: string = decodeURIComponent(sub[0]);
      const size: number = parseInt(sub[1]);
      return { label, size };
    });

    let out = new Iv4Settings();
    out.modified = modified;
    out.formData = { majorNetwork, requirements };

    return out;
  }
}

const STORAGE_METHOD = localStorage;
const STORAGE_KEY = 'ipv4';

@Injectable()
export class Ipv4StorageService {
  constructor() {}

  private loadStorage(): Iv4Settings {
    const storageItem = STORAGE_METHOD.getItem(STORAGE_KEY);
    if (!storageItem) {
      const newSettings = new Iv4Settings();
      this.saveStorage(newSettings);
      return newSettings;
    }
    const item = Iv4Settings.decode(storageItem);
    return item;
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