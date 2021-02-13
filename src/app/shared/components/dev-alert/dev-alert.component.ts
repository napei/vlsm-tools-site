import { Component, EventEmitter, Input, OnInit, Optional, Output } from '@angular/core';

@Component({
  selector: 'app-dev-alert',
  templateUrl: './dev-alert.component.html',
  styleUrls: ['./dev-alert.component.scss'],
})
export class DevAlertComponent implements OnInit {
  @Output() public hardReset: EventEmitter<any> = new EventEmitter();
  public hasCallback = false;

  constructor() {}

  public ngOnInit(): void {
    this.hasCallback = this.hardReset.observers.length > 0;
  }

  public reset() {
    this.hardReset.emit();
  }
}
