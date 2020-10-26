import { Component, OnInit } from '@angular/core';
import { Validators } from '@angular/forms';
import { IPv4Network, Subnet, SubnetRequirements } from 'vlsm-tools';
import { FormArray, FormControl, FormGroup } from '@ngneat/reactive-forms';
import { BehaviorSubject, Observable } from 'rxjs';

function isSubnetRequirementsValid(r: SubnetRequirements): boolean {
  return r.label && r.label.length > 0 && r.size && r.size > 0;
}

interface IRequirementsForm {
  majorNetwork: string;
  requirements: SubnetRequirements[];
}

@Component({
  selector: 'app-ipv4-vlsm',
  templateUrl: './ipv4-vlsm.component.html',
  styleUrls: ['./ipv4-vlsm.component.scss'],
})
export class Ipv4VlsmComponent implements OnInit {
  constructor() {}
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
  }

  public deleteRequirement(i: number): void {
    this.reqs.controls.splice(i, 1);
  }

  public calculate(): void {}

  public requirementsForm: FormGroup<IRequirementsForm> = new FormGroup<IRequirementsForm>({
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
    this.requirementsForm.value$.subscribe((v: IRequirementsForm) => {
      const r = v.requirements.filter((rr) => {
        return isSubnetRequirementsValid(rr);
      });

      if (r.length < 1) {
        return;
      }

      try {
        this.network = new IPv4Network(r, v.majorNetwork);
      } catch (e) {
        this._hasError.next(true);
        return;
      }

      this._hasError.next(false);
    });
  }
}
