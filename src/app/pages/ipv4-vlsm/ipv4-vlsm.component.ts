import { Component, OnInit } from '@angular/core';
import { IPv4Network, SubnetRequirements } from 'vlsm-tools';

@Component({
  selector: 'app-ipv4-vlsm',
  templateUrl: './ipv4-vlsm.component.html',
  styleUrls: ['./ipv4-vlsm.component.scss'],
})
export class Ipv4VlsmComponent implements OnInit {
  constructor() {}
  public network: IPv4Network;
  public majorNetwork = '80.40.0.0/12';
  ngOnInit(): void {
    const req: SubnetRequirements[] = [
      { label: 'VLAN37', size: 800 },
      { label: 'VLAN379', size: 200 },
      { label: 'VLAN516', size: 120 },
      { label: 'Database LAN', size: 20 },
      { label: 'VLAN1', size: 6 },
      { label: 'Internal Serial', size: 2 },
    ];

    this.network = new IPv4Network(req, this.majorNetwork);
  }
}
