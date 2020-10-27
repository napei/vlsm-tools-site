import { Component, OnInit } from '@angular/core';
import { Validators } from '@angular/forms';
import { IPv4Network, Subnet, SubnetRequirements } from 'vlsm-tools';
import { FormArray, FormControl, FormGroup } from '@ngneat/reactive-forms';
import { BehaviorSubject, Observable } from 'rxjs';
import { Ipv4StorageService, isSubnetRequirementsValid, Iv4RequirementsForm, Iv4Settings } from './ipv4-storage.service';

@Component({
  selector: 'app-ipv4-vlsm',
  templateUrl: './ipv4-vlsm.component.html',
  styleUrls: ['./ipv4-vlsm.component.scss'],
})
export class Ipv4VlsmComponent implements OnInit {
  private _settings: BehaviorSubject<Iv4Settings> = new BehaviorSubject<Iv4Settings>(new Iv4Settings());

  public get settings$() {
    return this._settings.asObservable();
  }
  constructor(private _storage: Ipv4StorageService) {}
  public network: IPv4Network;

  private _hasError: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(null);
  public get hasError(): Observable<boolean> {
    return this._hasError.asObservable();
  }

  public createRequirement(): FormGroup<SubnetRequirements> {
    return new FormGroup<SubnetRequirements>({
      label: new FormControl<string>('', Validators.required),
      size: new FormControl<number>(null, Validators.required),
    });
  }

  public addNewRequirement(): void {
    this.reqs.push(this.createRequirement());
    this.requirementsForm.updateValueAndValidity();
  }

  public deleteRequirement(i: number): void {
    this.reqs.controls.splice(i, 1);
    this.requirementsForm.updateValueAndValidity();
  }

  public calculate(v: Iv4RequirementsForm): void {
    // console.log(v);
    const r = v.requirements.filter((rr) => {
      return isSubnetRequirementsValid(rr);
    });

    if (r.length < 1) {
      this.network = null;
      this._hasError.next(null);
      return;
    }

    try {
      this.network = new IPv4Network(r, v.majorNetwork);
    } catch (e) {
      console.error(e);
      this._hasError.next(true);
      return;
    }

    this._hasError.next(false);
  }

  public requirementsForm: FormGroup<Iv4RequirementsForm> = new FormGroup<Iv4RequirementsForm>({
    majorNetwork: new FormControl<string>('192.168.1.0/24', [Validators.required]),
    requirements: new FormArray<FormGroup<SubnetRequirements>>([
      this.createRequirement(),
      this.createRequirement(),
      this.createRequirement(),
      this.createRequirement(),
    ]),
  });

  public get reqs(): FormArray<FormGroup<SubnetRequirements>> {
    return this.requirementsForm.controls.requirements as FormArray<FormGroup<SubnetRequirements>>;
  }

  ngOnInit(): void {
    const loadedData = this._storage.currentSettings;
    if (loadedData) {
      this._settings.next(loadedData);
      console.log(loadedData);
      if (loadedData.formData) {
        console.log(loadedData.formData.requirements.length);
        if (loadedData.formData.requirements.length > 4) {
          for (let i = 4; i < loadedData.formData.requirements.length; i++) {
            this.reqs.push(this.createRequirement());
          }
          this.requirementsForm.updateValueAndValidity();
        }

        this.requirementsForm.patchValue({ majorNetwork: loadedData.formData.majorNetwork, requirements: loadedData.formData.requirements });
      }
    }

    this._settings.subscribe((s) => {
      this._storage.currentSettings = s;
    });

    this.requirementsForm.value$.subscribe((v: Iv4RequirementsForm) => {
      this.calculate(v);
      const newSettings = new Iv4Settings();
      newSettings.modified = new Date();
      newSettings.formData = {
        majorNetwork: v.majorNetwork,
        requirements: v.requirements,
      };
      this._settings.next(newSettings);
    });
  }
}
