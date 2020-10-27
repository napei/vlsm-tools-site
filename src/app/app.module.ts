import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { Angulartics2Module } from 'angulartics2';

@NgModule({
  declarations: [AppComponent],
  imports: [BrowserModule, AppRoutingModule, Angulartics2Module.forRoot({ developerMode: false })],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
