import { Component, OnInit } from '@angular/core';
import { Validators } from '@angular/forms';
import { faUndo } from '@fortawesome/free-solid-svg-icons';
import { HotToastService } from '@ngneat/hot-toast';
import { AbstractControl, FormControl, FormGroup } from '@ngneat/reactive-forms';
import { Angulartics2GoogleGlobalSiteTag } from 'angulartics2/gst';
import { BigInteger } from 'jsbn';
import { Observable } from 'rxjs';
import { TitleService } from 'src/app/core/services/title.service';
import { IPv6Network } from 'vlsm-tools';
import { IPv6Address } from 'vlsm-tools/build/cjs/src/ipv6/ipv6';
import { Divisor, Ipv6StorageService, Iv6RequirementsForm, Iv6Settings } from './ipv6-storage.service';

const ipFormatValidator = (control: AbstractControl): { [key: string]: any } | null => {
  const test = IPv6Address.isValid(control.value);
  return test ? null : { pattern: { value: control.value } };
};

@Component({
  selector: 'app-ipv6-vlsm',
  templateUrl: './ipv6-vlsm.component.html',
  styleUrls: ['./ipv6-vlsm.component.scss'],
})
export class Ipv6VlsmComponent implements OnInit {
  public network: IPv6Network;
  public settings$: Observable<Iv6Settings>;
  public results: IPv6Address[] = new Array<IPv6Address>();

  public icons = { undo: faUndo };
  public masks: { label: string; value: number }[];

  public requirementsForm: FormGroup<Iv6RequirementsForm> = new FormGroup<Iv6RequirementsForm>(
    {
      majorAddress: new FormControl<string>(null, [ipFormatValidator]),
      divisor: new FormGroup<Divisor>(
        {
          cidrSize: new FormControl<number>(null, [Validators.min(0), Validators.max(127)]),
          numSubnets: new FormControl<number>(null, [Validators.min(1)]),
        },
        { updateOn: 'change' }
      ),
    },
    { updateOn: 'change' }
  );

  constructor(
    private storage: Ipv6StorageService,
    private title: TitleService,
    private toast: HotToastService,
    private tracking: Angulartics2GoogleGlobalSiteTag
  ) {
    this.masks = Array(128)
      .fill({})
      .map((_, i) => ({ label: '/' + i.toString(), value: i }));
    this.masks.shift();
  }

  public async ngOnInit() {
    this.title.set('IPv6 Subnetting');
    this.settings$ = this.storage.watch$;

    this.loadData(await this.storage.get().toPromise());

    this.requirementsForm.value$.subscribe((v: Iv6RequirementsForm) => {
      if (this.requirementsForm.controls.majorAddress.valid) {
        const newSettings = new Iv6Settings();
        newSettings.modified = new Date();
        newSettings.formData = {
          majorAddress: v.majorAddress,
          divisor: v.divisor,
        };

        this.network = new IPv6Network(newSettings.formData.majorAddress);
        this.storage.set(newSettings);
      }
    });

    this.requirementsForm.controls.majorAddress.valueChanges.subscribe((v) => {
      this.results = [];
    });
  }

  public get f() {
    return this.requirementsForm.controls;
  }

  public get d() {
    return (this.f.divisor as FormGroup<Divisor>).controls;
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

  public hasMaxError(c: AbstractControl): boolean {
    return c.touched && c.errors?.max;
  }

  public calculateSubnetCount(): void {
    const t = this.toast.loading('Calculating...');

    try {
      this.results = this.network.subdivideIntoNumSubnets(this.d.numSubnets.value);
      console.log(this.network.majorNetwork.possibleSubnets(64));
      t.updateMessage('Finished');
      t.updateToast({ type: 'success', duration: 3000 });
    } catch (e) {
      t.updateMessage(e.toString());
      t.updateToast({ type: 'error', duration: 4000 });
    }

    this.tracking.eventTrack('calc_subnet_count', { label: 'Calculate by subnet count', category: 'vlsm_v6' });
  }

  public setResults(r: IPv6Address[]) {
    this.results = r;
  }

  public calculateCidrSize(): void {
    const t = this.toast.loading('Calculating...');

    try {
      this.results = this.network.subdivideIntoPrefixes(this.d.cidrSize.value);
      t.updateMessage('Finished');
      t.updateToast({ type: 'success', duration: 3000 });
    } catch (e) {
      t.updateMessage(e.toString());
      t.updateToast({ type: 'error', duration: 4000 });
    }

    this.tracking.eventTrack('calc_cidr_size', { label: 'Calculate by CIDR size', category: 'vlsm_v6' });
  }

  public resetRequirements() {
    this.results = [];
    const s = new Iv6Settings();
    this.requirementsForm.patchValue({ divisor: s.formData.divisor });
    this.tracking.eventTrack('req_reset', { label: 'Requirements reset', category: 'vlsm_v6' });
    this.toast.success('Requirements reset');
  }

  public resetMajorNetwork() {
    this.results = [];
    const s = new Iv6Settings();
    this.requirementsForm.patchValue({ majorAddress: s.formData.majorAddress });
    this.tracking.eventTrack('maj_reset', { label: 'Major network reset', category: 'vlsm_v6' });
    this.toast.success('Major network reset');
  }

  private loadData(loadedData: Iv6Settings | null) {
    if (!loadedData) {
      const s = new Iv6Settings();
      this.requirementsForm.patchValue(s.formData);
      this.storage.set(s);
    }

    this.requirementsForm.patchValue(loadedData.formData);
  }
}
