import { Injectable } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material';
import { Observable } from 'rxjs';
import { AppLoaderComponent } from './app-loader.component';
import { TranslateService } from '@ngx-translate/core';
import { T } from '../../translate-marker';

@Injectable()
export class AppLoaderService {
  dialogRef: MatDialogRef<AppLoaderComponent>;
  constructor(private dialog: MatDialog, private translate: TranslateService) { }

  public open(title: string = T('Please wait')): Observable<boolean> {
    this.translate.get(title).subscribe(t => {
      this.dialogRef = this.dialog.open(AppLoaderComponent, {disableClose: true});
      this.dialogRef.updateSize('200px', '200px');
      this.dialogRef.componentInstance.title = t;
    });
    return this.dialogRef.afterClosed();
  }

  public close() {
    this.dialogRef.close();
  }
}
