import { Component, Inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { TranslateService } from '@ngx-translate/core';
import { PreferencesService } from 'app/core/services/preferences.service';
import helptext from 'app/helptext/about';
import { CoreService, CoreEvent } from 'app/core/services/core.service';
import { LocaleService } from 'app/services/locale.service';
import { AppLoaderService } from '../../../../services';
import { T } from '../../../../translate-marker';
import globalHelptext from '../../../../helptext/global-helptext';
import { DialogService } from '../../../../services/dialog.service';

export interface DialogData {
  extraMsg: boolean;
  systemType: string;
}

@Component({
  selector: 'about-dialog',
  styleUrls: ['./about-dialog.component.css'],
  templateUrl: './about-dialog.component.html',
})
export class AboutModalDialog {
  copyrightYear = this.localeService.getCopyrightYearFromBuildTime();
  product_type: string;
  extraMsg: boolean;
  systemType: string;
  helptext = helptext;

  constructor(
    private localeService: LocaleService,
    public dialogRef: MatDialogRef<AboutModalDialog>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData,
    protected loader: AppLoaderService,
    protected http: HttpClient, protected dialogService: DialogService,
    protected translate: TranslateService,
    protected core: CoreService,
    private prefServices: PreferencesService,
  ) {
    this.extraMsg = data.extraMsg;
    this.systemType = data.systemType;
  }

  turnOffWelcomeDialog() {
    this.core.emit({ name: 'ChangePreference', data: { key: 'showWelcomeDialog', value: false }, sender: this });
  }
}
