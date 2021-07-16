import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { AppAccordionDirective } from './app-accordion.directive';
import { EqualValidatorDirective } from './equal-validator.directive';
import { IXAutoDirective } from './ix-auto.directive';
import { LazyViewerDirective } from './lazy-viewer/lazy-viewer.directive';
import { SideNavAccordionDirective } from './sidenav-accordion.directive';

@NgModule({
  imports: [
    CommonModule,
  ],
  declarations: [
    EqualValidatorDirective,
    SideNavAccordionDirective,
    AppAccordionDirective,
    LazyViewerDirective,
    IXAutoDirective,
  ],
  exports: [
    EqualValidatorDirective,
    SideNavAccordionDirective,
    AppAccordionDirective,
    LazyViewerDirective,
    IXAutoDirective,
  ],
})
export class CommonDirectivesModule { }
