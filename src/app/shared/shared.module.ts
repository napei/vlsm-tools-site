import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ContainerLayoutComponent } from './layouts/container/container.component';
import { Container } from '@angular/compiler/src/i18n/i18n_ast';
import { HeaderComponent } from './header/header.component';
import { FooterComponent } from './footer/footer.component';
import { RouterModule } from '@angular/router';

@NgModule({
  declarations: [ContainerLayoutComponent, HeaderComponent, FooterComponent],
  imports: [CommonModule, RouterModule],
  exports: [ContainerLayoutComponent, HeaderComponent, FooterComponent],
})
export class SharedModule {}
