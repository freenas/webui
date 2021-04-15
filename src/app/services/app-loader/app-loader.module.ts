import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CoreComponents } from 'app/core/components/corecomponents.module';
import { TranslateModule } from '@ngx-translate/core';
import { AppLoaderComponent } from './app-loader.component';
import { AppLoaderService } from './app-loader.service';

@NgModule({
  imports: [
    CommonModule,
    CoreComponents,
    MatDialogModule,
    MatIconModule,
    MatProgressSpinnerModule,
    TranslateModule,
  ],
  providers: [AppLoaderService],
  declarations: [AppLoaderComponent],
  entryComponents: [AppLoaderComponent],
})
export class AppLoaderModule { }
