import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgxUploaderModule } from 'ngx-uploader';
import { FlexLayoutModule } from '@angular/flex-layout';
import { TranslateModule } from '@ngx-translate/core';
import { CoreService } from 'app/core/services/core.service';
import { MaterialModule } from '../../appMaterial.module';

import { EntityModule } from '../common/entity/entity.module';
import { NetworkService } from '../../services';
import { EntityFormService } from '../common/entity/entity-form/services/entity-form.service';

import { StaticRouteFormComponent } from './staticroutes/staticroute-form';
import { StaticRouteListComponent } from './staticroutes/staticroute-list';
import { InterfacesFormComponent } from './interfaces/interfaces-form';
import { InterfacesListComponent } from './interfaces/interfaces-list';
import { ConfigurationComponent } from './configuration';
import { IPMIComponent } from './ipmi';
import { NetworkSummaryComponent } from './networksummary/networksummary.component';
import { routing } from './network.routing';

@NgModule({
  imports: [
    EntityModule, CommonModule, FormsModule,
    ReactiveFormsModule, NgxUploaderModule, routing, MaterialModule, FlexLayoutModule, TranslateModule,
  ],
  declarations: [
    StaticRouteFormComponent,
    StaticRouteListComponent,
    InterfacesListComponent,
    InterfacesFormComponent,
    ConfigurationComponent,
    IPMIComponent,
    NetworkSummaryComponent,
  ],
  providers: [NetworkService, EntityFormService, CoreService],
})
export class NetworkModule {
}
