import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ContainerLayoutComponent } from './layouts/container/container.component';
import { Container } from '@angular/compiler/src/i18n/i18n_ast';
import { HeaderComponent } from './header/header.component';
import { FooterComponent } from './footer/footer.component';
import { RouterModule } from '@angular/router';
import { DevAlertComponent } from './components/dev-alert/dev-alert.component';
import { NgbAlertModule } from '@ng-bootstrap/ng-bootstrap';
import { CustomNumberPipe } from './pipes/custom-number.pipe';

@NgModule({
  declarations: [ContainerLayoutComponent, HeaderComponent, FooterComponent, DevAlertComponent, CustomNumberPipe],
  imports: [CommonModule, RouterModule, NgbAlertModule],
  exports: [ContainerLayoutComponent, HeaderComponent, FooterComponent, DevAlertComponent, CustomNumberPipe],
  providers: [CustomNumberPipe],
})
export class SharedModule {}
