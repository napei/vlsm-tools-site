import { Component, OnInit, TemplateRef } from '@angular/core';
import { Validators } from '@angular/forms';
import { IPv4Network, IPv4SubnetRequirements } from 'vlsm-tools';
import { AbstractControl, FormArray, FormControl, FormGroup } from '@ngneat/reactive-forms';
import { BehaviorSubject, Observable } from 'rxjs';
import { Ipv4StorageService, isSubnetRequirementsValid, Iv4RequirementsForm, Iv4Settings } from './ipv4-storage.service';
import { faCheck, faCopy, faFileExport, faFileImport, faPlus, faTimes, faUndoAlt } from '@fortawesome/free-solid-svg-icons';

import { NgbModal, NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ClipboardService } from 'ngx-clipboard';

// const DEFAULT_NETWORK = '192.168.1.0/24';
// eslint-disable-next-line max-len
const IP_REGEX = /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\/([1-9]|[1-2][0-9]|3[0-2])$/;

@Component({
  selector: 'app-ipv4-vlsm',
  templateUrl: './ipv4-vlsm.component.html',
  styleUrls: ['./ipv4-vlsm.component.scss'],
})
export class Ipv4VlsmComponent implements OnInit {
  public icons = {
    plus: faPlus,
    cross: faTimes,
    undo: faUndoAlt,
    import: faFileImport,
    export: faFileExport,
    copy: faCopy,
    check: faCheck,
  };
  public importFailed = false;

  public modalExportString = '';
  public showCopyComplete = false;
  public chartData: { name: string; value: number }[];

  public get settings$() {
    return this.settings.asObservable();
  }

  public requirementsForm: FormGroup<Iv4RequirementsForm> = new FormGroup<Iv4RequirementsForm>({
    majorNetwork: new FormControl<string>(null, {
      validators: [Validators.required, Validators.pattern(IP_REGEX)],
      updateOn: 'change',
    }),
    requirements: new FormArray<FormGroup<IPv4SubnetRequirements>>([
      this.createRequirement(),
      this.createRequirement(),
      this.createRequirement(),
      this.createRequirement(),
    ]),
  });
  public network: IPv4Network;
  private settings: BehaviorSubject<Iv4Settings> = new BehaviorSubject<Iv4Settings>(new Iv4Settings());
  private hasError: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(null);

  constructor(private storage: Ipv4StorageService, private modalService: NgbModal, private clipboardService: ClipboardService) {}

  public ngOnInit(): void {
    const loadedData = this.storage.currentSettings;

    this.loadData(loadedData);
    this.settings.subscribe((s) => {
      this.storage.currentSettings = s;
    });

    this.requirementsForm.value$.subscribe((v: Iv4RequirementsForm) => {
      if (this.requirementsForm.valid) {
        this.calculate(v);
        const newSettings = new Iv4Settings();
        newSettings.modified = new Date();
        newSettings.formData = {
          majorNetwork: v.majorNetwork,
          requirements: v.requirements,
        };
        this.settings.next(newSettings);
      }
    });
  }

  public get hasError$(): Observable<boolean> {
    return this.hasError.asObservable();
  }

  public createRequirement(): FormGroup<IPv4SubnetRequirements> {
    return new FormGroup<IPv4SubnetRequirements>({
      label: new FormControl<string>(''),
      size: new FormControl<number>(null, [Validators.min(0)]),
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
    const r = v.requirements.filter((rr) => isSubnetRequirementsValid(rr));

    if (r.length < 1) {
      this.network = null;
      this.hasError.next(null);
      return;
    }

    try {
      this.network = new IPv4Network(r, v.majorNetwork);
    } catch (e) {
      this.hasError.next(true);
      return;
    }

    this.hasError.next(false);
    const d = this.network.subnets.map((s) => ({ name: s.requirements.label, value: s.networkSize }));
    d.push({ name: 'Unallocated', value: this.network.unusedSize });
    this.chartData = d;
  }

  public hasRequiredError(c: AbstractControl): boolean {
    return c.touched && c.errors?.required;
  }

  public hasPatternError(c: AbstractControl): boolean {
    return !c.pristine && c.errors?.pattern;
  }

  public hasMinError(c: AbstractControl): boolean {
    return c.touched && c.errors?.min;
  }

  public get reqs(): FormArray<FormGroup<IPv4SubnetRequirements>> {
    return this.requirementsForm.controls.requirements as FormArray<FormGroup<IPv4SubnetRequirements>>;
  }

  public get f() {
    return this.requirementsForm.controls;
  }

  public hardReset(): void {
    this.storage.clearStorage();
    this.resetRequirements();
  }

  public resetRequirements(): void {
    const blank = new Iv4Settings();
    (this.requirementsForm.controls.requirements as FormArray<FormGroup<IPv4SubnetRequirements>>) = new FormArray<
      FormGroup<IPv4SubnetRequirements>
    >([this.createRequirement(), this.createRequirement(), this.createRequirement(), this.createRequirement()]);
    this.requirementsForm.patchValue({ requirements: blank.formData.requirements });
    this.chartData = [];
  }

  public importString(content: TemplateRef<NgbActiveModal>): void {
    this.modalService.open(content, { size: 'lg' }).result.then(
      (closedReason: string) => {
        // Only care if it was closed
        if (!closedReason) {
          return;
        }
        const res = closedReason.trim();
        if (res === '') {
          return;
        }
        let data: Iv4Settings;
        try {
          data = Iv4Settings.decode(res);
        } catch (e) {
          this.importFailed = true;
          return;
        }

        if (data) {
          this.loadData(data);
        }
      },
      () => {}
    );
  }

  public exportString(content: TemplateRef<NgbActiveModal>): void {
    this.modalExportString = this.settings.value.encode();
    this.modalService.open(content, { size: 'lg' });
  }

  public copyExportString(): void {
    this.clipboardService.copy(this.modalExportString);
    this.showCopyComplete = true;
    setTimeout(() => {
      this.showCopyComplete = false;
    }, 1000);
  }

  private loadData(loadedData: Iv4Settings) {
    if (!loadedData) {
      this.settings.next(new Iv4Settings());
      return;
    }

    if (!loadedData.formData?.requirements) {
      loadedData.formData.requirements = [];
    }

    if (loadedData.formData.requirements.length > 4) {
      for (let i = 4; i < loadedData.formData.requirements.length; i++) {
        this.reqs.push(this.createRequirement());
      }
      this.requirementsForm.updateValueAndValidity();
    }

    this.requirementsForm.patchValue({
      majorNetwork: loadedData.formData.majorNetwork,
      requirements: loadedData.formData.requirements,
    });
    this.requirementsForm.updateValueAndValidity();

    this.settings.next(loadedData);
  }
}
