import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { ProductType } from 'app/enums/product-type.enum';
import { WebSocketService, SystemGeneralService } from 'app/services';
import { AppLoaderService } from 'app/services/app-loader/app-loader.service';
import { DialogService } from 'app/services/dialog.service';
import { LocaleService } from 'app/services/locale.service';

@UntilDestroy()
@Component({
  selector: 'system-reboot',
  templateUrl: './reboot.component.html',
  styleUrls: ['./reboot.component.scss'],
})
export class RebootComponent implements OnInit {
  product_type: ProductType;
  copyrightYear = this.localeService.getCopyrightYearFromBuildTime();

  readonly ProductType = ProductType;

  constructor(protected ws: WebSocketService, protected router: Router,
    protected loader: AppLoaderService, public translate: TranslateService,
    protected dialogService: DialogService, protected dialog: MatDialog,
    private sysGeneralService: SystemGeneralService, private localeService: LocaleService) {
    this.ws = ws;
    this.sysGeneralService.getProductType$.pipe(untilDestroyed(this)).subscribe((res) => {
      this.product_type = res as ProductType;
    });
  }

  isWSConnected(): void {
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

  ngOnInit(): void {
    this.product_type = window.localStorage.getItem('product_type') as ProductType;

    this.dialog.closeAll();
    this.ws.call('system.reboot', {}).pipe(untilDestroyed(this)).subscribe(
      () => {
      },
      (res) => { // error on reboot
        this.dialogService.errorReport(res.error, res.reason, res.trace.formatted)
          .pipe(untilDestroyed(this))
          .subscribe(() => {
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
