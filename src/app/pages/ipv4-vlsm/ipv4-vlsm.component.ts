import { Component, OnInit, TemplateRef } from '@angular/core';
import { Validators } from '@angular/forms';
import { IPv4Network, IPv4SubnetRequirements } from 'vlsm-tools';
import { AbstractControl, FormArray, FormControl, FormGroup } from '@ngneat/reactive-forms';
import { BehaviorSubject, Observable } from 'rxjs';
import { IPv4StorageService, isSubnetRequirementsValid, Iv4RequirementsForm, Iv4Settings } from './ipv4-storage.service';
import { faCheck, faCopy, faFileExport, faFileImport, faPlus, faTimes, faUndoAlt } from '@fortawesome/free-solid-svg-icons';

import { NgbModal, NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ClipboardService } from 'ngx-clipboard';
import { HotToastService } from '@ngneat/hot-toast';
import { StorageMap } from '@ngx-pwa/local-storage';
import { Angulartics2GoogleGlobalSiteTag } from 'angulartics2/gst';
import { TitleService } from 'src/app/core/services/title.service';

// eslint-disable-next-line max-len
const IP_REGEX = /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\/([1-9]|[1-2][0-9]|3[0-2])$/;

const storageIndex = 'ipv4';

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
  };

  public modalExportString = '';
  public chartData: { name: string; value: number }[];

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
  public settings$: Observable<Iv4Settings>;
  private hasError: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(null);

  constructor(
    private storage: IPv4StorageService,
    private modalService: NgbModal,
    private clipboardService: ClipboardService,
    private toast: HotToastService,
    private tracking: Angulartics2GoogleGlobalSiteTag,
    private title: TitleService
  ) {}

  public async ngOnInit() {
    this.title.set('IPv4 Subnetting');
    this.settings$ = this.storage.watch$;
    this.loadData(await this.storage.get().toPromise());

    this.requirementsForm.value$.subscribe((v: Iv4RequirementsForm) => {
      if (this.requirementsForm.valid) {
        this.calculate(v);
        const newSettings = new Iv4Settings();
        newSettings.modified = new Date();
        newSettings.formData = {
          majorNetwork: v.majorNetwork,
          requirements: v.requirements,
        };
        this.storage.set(newSettings);
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
    this.storage.delete();
    this.resetRequirements();
    this.tracking.eventTrack('hard_reset', { label: 'Hard reset', category: 'vlsm_v4' });
  }

  public async resetRequirements() {
    const newSettings = new Iv4Settings();
    const {
      formData: { majorNetwork },
    } = await this.storage.get().toPromise();
    newSettings.formData.majorNetwork = majorNetwork;

    const controls = new FormArray<FormGroup<IPv4SubnetRequirements>>(
      newSettings.formData.requirements.map(() => this.createRequirement())
    );
    this.requirementsForm.registerControl('requirements', controls);
    this.requirementsForm.patchValue({ requirements: newSettings.formData.requirements });
    this.chartData = [];
    this.storage.set(newSettings);
    this.toast.success('Requirements reset');
    this.tracking.eventTrack('req_reset', { label: 'Requirements reset', category: 'vlsm_v4' });
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
          data = Iv4Settings.decodeBase64(res);
        } catch (e) {
          this.toast.error('Invalid import string');
          this.tracking.exceptionTrack({ description: 'invalid import string', fatal: true });
          return;
        }

        if (data) {
          this.loadData(data);
          this.toast.success('Import successful');
          this.tracking.eventTrack('import_success', { label: 'Import Successful', category: 'vlsm_v4' });
        }
      },
      () => {}
    );
  }

  public async exportString(content: TemplateRef<NgbActiveModal>) {
    const settings = await this.storage.get().toPromise();
    this.modalExportString = settings.encodeBase64();
    this.modalService.open(content, { size: 'lg' });
  }

  public copyExportString(): void {
    this.clipboardService.copy(this.modalExportString);
    this.toast.success('Copied to clipboard');
    this.tracking.eventTrack('export_string_copy', { label: 'Export string copied', category: 'vlsm_v4' });
  }

  private loadData(loadedData: Iv4Settings | null) {
    if (loadedData.formData.requirements.length > 4) {
      loadedData.formData.requirements.forEach((_) => {
        this.reqs.push(this.createRequirement());
      });
    }

    this.requirementsForm.patchValue({
      majorNetwork: loadedData.formData.majorNetwork,
      requirements: loadedData.formData.requirements,
    });

    this.storage.set(loadedData);
  }
}
