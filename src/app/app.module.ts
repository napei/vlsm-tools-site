import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { Ipv4VlsmComponent } from './pages/ipv4-vlsm/ipv4-vlsm.component';

@NgModule({
  declarations: [AppComponent, Ipv4VlsmComponent],
  imports: [BrowserModule, AppRoutingModule],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
