import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import {
  Component, AfterViewChecked, ViewChild, ElementRef, EventEmitter,
} from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { WebSocketService } from '../../../../services';

@Component({
  selector: 'consolepanel-dialog',
  styleUrls: ['./consolepanel-dialog.component.scss'],
  templateUrl: './consolepanel-dialog.component.html',
})
export class ConsolePanelModalDialog {
  refreshMsg: String = 'Check to stop refresh';
  intervalPing;
  consoleMsg: String = 'Loading...';
  @ViewChild('footerBarScroll', { static: true }) private footerBarScroll: ElementRef;
  onEventEmitter = new EventEmitter();

  constructor(
    protected translate: TranslateService,
    public dialogRef: MatDialogRef<ConsolePanelModalDialog>,
  ) { }

  ngOnInit() {
    this.getLogConsoleMsg();
  }

  ngAfterViewChecked() {
  }

  scrollToBottomOnFooterBar(): void {
    try {
      this.footerBarScroll.nativeElement.scrollTop = this.footerBarScroll.nativeElement.scrollHeight;
    } catch (err) { }
  }

  getLogConsoleMsg() {
    this.intervalPing = setInterval(() => {
      let isScrollBottom = false;
      const delta = 3;

      if (this.footerBarScroll.nativeElement.scrollTop + this.footerBarScroll.nativeElement.offsetHeight + delta >= this.footerBarScroll.nativeElement.scrollHeight) {
        isScrollBottom = true;
      }
      this.onEventEmitter.emit();
      if (isScrollBottom) {
        const timeout = setTimeout(() => {
          this.scrollToBottomOnFooterBar();
          clearTimeout(timeout);
        }, 500);
      }
    }, 1000);

    // First, will load once.
    const timeout = setTimeout(() => {
      this.scrollToBottomOnFooterBar();
      clearTimeout(timeout);
    }, 1500);
  }

  onStopRefresh(data) {
    if (data.checked) {
      clearInterval(this.intervalPing);
      this.refreshMsg = 'Uncheck to restart refresh';
    } else {
      this.getLogConsoleMsg();
      this.refreshMsg = 'Check to stop refresh';
    }
  }
}
