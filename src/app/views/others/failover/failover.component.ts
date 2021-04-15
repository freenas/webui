import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { MatDialog } from '@angular/material/dialog';
import { LocaleService } from 'app/services/locale.service';
import { WebSocketService } from '../../../services/ws.service';
import { AppLoaderService } from '../../../services/app-loader/app-loader.service';
import { DialogService } from '../../../services/dialog.service';
import globalHelptext from '../../../helptext/global-helptext';

@Component({
  selector: 'system-failover',
  templateUrl: './failover.component.html',
  styleUrls: ['./failover.component.css'],
})
export class FailoverComponent implements OnInit {
  product_type: string;
  copyrightYear = this.localeService.getCopyrightYearFromBuildTime();

  constructor(protected ws: WebSocketService, protected router: Router,
    protected loader: AppLoaderService, public translate: TranslateService,
    protected dialogService: DialogService, protected dialog: MatDialog, private localeService: LocaleService) {
    this.ws = ws;
    this.ws.call('system.product_type').subscribe((res) => {
      this.product_type = res;
    });
  }

  isWSConnected() {
    if (this.ws.connected) {
      this.loader.close();
      // ws is connected
      this.router.navigate(['/session/signin']);
    } else {
      setTimeout(() => {
        this.isWSConnected();
      }, 5000);
    }
  }

  ngOnInit() {
    this.product_type = window.localStorage.getItem('product_type');

    this.dialog.closeAll();
    this.ws.call('failover.force_master', {}).subscribe(
      (res) => {
      },
      (res) => { // error on reboot
        this.dialogService.errorReport(res.error, res.reason, res.trace.formatted).subscribe((closed) => {
          this.router.navigate(['/session/signin']);
        });
      },
      () => { // show reboot screen
        this.ws.prepare_shutdown();
        this.loader.open();
        setTimeout(() => {
          this.isWSConnected();
        }, 1000);
      },
    );
  }
}
