import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MaterialModule } from '../../appMaterial.module';
import { TranslateModule } from '@ngx-translate/core';
import { FlexLayoutModule } from '@angular/flex-layout';

import { JailService } from '../../services';
import { EntityModule } from '../common/entity/entity.module';

import { routing } from './jails.routing';
import { JailListComponent } from './jail-list';
import { StorageListComponent } from './storages/storage-list';
import { StorageFormComponent } from './storages/storage-form';
import { JailAddComponent } from './jail-add';
import { JailEditComponent } from './jail-edit';
import { JailWizardComponent } from './jail-wizard';
import { JailShellComponent } from './jail-shell';

@NgModule({
  imports : [
    CommonModule, FormsModule, ReactiveFormsModule, routing, EntityModule, MaterialModule, TranslateModule, FlexLayoutModule
  ],
  declarations : [
    JailListComponent,
    StorageListComponent,
    StorageFormComponent,
    JailAddComponent,
    JailEditComponent,
    JailWizardComponent,
    JailShellComponent
  ],
  providers : [
    JailService,
  ]
})
export class JailsModule {
}