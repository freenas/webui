import { NgModule, ModuleWithProviders } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from './api.service';
import { AnimationService } from './animation.service';
import { CoreService } from './core.service';
import { ThemeService } from '../../services/theme/theme.service';
import { PreferencesService } from './preferences.service';


/*
 *
 * This is the Core Module. By importing this module you'll 
 * ensure your page will have the right dependencies in place
 * to make use of the CoreService (event bus) and any helper
 * services that get added later on.
 *
 * Import this in app.module.ts and call it's forRoot() method
 *
 * */

@NgModule({
  imports: [
    CommonModule,
  ],
  providers: [
    CoreService,
    ApiService,
    AnimationService,
    ThemeService,
    PreferencesService
  ],
  exports: [ // Modules and Components here
    CommonModule
  ]
})
export class CoreServices {
  static forRoot(): ModuleWithProviders {
    return {
      ngModule: CoreServices,
      providers: [
	CoreService,
	ApiService,
	AnimationService,
        PreferencesService,
        ThemeService
      ]
    }
  }
}
