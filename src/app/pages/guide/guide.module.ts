import { NgModule } from '@angular/core';
import { MaterialModule } from 'app/app-material.module';
import { GuideComponent } from './guide.component';
import { routing } from './guide.routing';

@NgModule({
  imports: [routing, MaterialModule],
  declarations: [
    GuideComponent,
  ],
  providers: [],
})
export class GuideModule {}
