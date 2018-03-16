import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import * as domHelper from '../../../helpers/dom.helper';
import { ThemeService } from '../../../services/theme/theme.service';
import { WebSocketService } from '../../../services/ws.service';
import { DialogService } from '../../../services/dialog.service';
import { AboutModalDialog } from '../dialog/about/about-dialog.component';
import { TourService } from '../../../services/tour.service';
import { NotificationAlert, NotificationsService } from '../../../services/notifications.service';
import { MatSnackBar, MatDialog, MatDialogRef } from '@angular/material';
import { Idle, DEFAULT_INTERRUPTSOURCES } from '@ng-idle/core';
import * as hopscotch from 'hopscotch';
import { RestService } from "../../../services/rest.service";
import { LanguageService } from "../../../services/language.service"
import { Observable } from "rxjs/Observable";
import { Subscription } from "rxjs/Subscription";
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'topbar',
//  styleUrls: ['./topbar.component.css', '../../../../../node_modules/flag-icon-css/css/flag-icon.css'],
styleUrls: ['./topbar.component.css'],
templateUrl: './topbar.template.html'
})
export class TopbarComponent implements OnInit, OnDestroy {

  @Input() sidenav;
  @Input() notificPanel;

  notifications: NotificationAlert[] = [];

  @Output() onLangChange = new EventEmitter<any>();

  interval: any;

  continuosStreaming: Subscription;
  showReplication = false;
  showResilvering = false;
  replicationDetails;
  resilveringDetails;
  currentTheme:string = "ix-blue";

  constructor(
    public themeService: ThemeService,
    private router: Router,
    private notificationsService: NotificationsService,
    private activeRoute: ActivatedRoute,
    private ws: WebSocketService,
    private rest: RestService,
    public language: LanguageService,
    private dialogService: DialogService,
    private tour: TourService,
    public dialog: MatDialog,
    public snackBar: MatSnackBar,
    private idle: Idle,
    public translate: TranslateService ) {

    idle.setIdle(10); // 10 seconds for delaying
    idle.setTimeout(900); // 15 minutes for waiting of activity
    idle.setInterrupts(DEFAULT_INTERRUPTSOURCES);

    idle.onTimeoutWarning.subscribe((countdown:number) => {
      // Countdown - console.log('TimeoutWarning: ' + countdown);
    });
    idle.onTimeout.subscribe(() => {
      // Close all dialogs before auto-login
      this.dialog.closeAll();
      this.ws.logout();
    });
    idle.watch();
  }

  ngOnInit() {
    let theme = this.themeService.currentTheme();
    this.currentTheme = theme.name;

    const showTour = localStorage.getItem(this.router.url) || 'true';

    if (showTour === "true") {
      hopscotch.startTour(this.tour.startTour(this.router.url));
      localStorage.setItem(this.router.url, 'false');
    }

    const notifications = this.notificationsService.getNotificationList();

    notifications.forEach((notificationAlert: NotificationAlert) => {
      if (notificationAlert.dismissed === false) {
        this.notifications.push(notificationAlert);
      }
    });
    this.notificationsService.getNotifications().subscribe((notifications1) => {
      this.notifications = [];
      notifications1.forEach((notificationAlert: NotificationAlert) => {
        if (notificationAlert.dismissed === false) {
          this.notifications.push(notificationAlert);
        }
      });
    });

    this.continuosStreaming = Observable.interval(10000).subscribe(x => {
      this.showReplicationStatus();
    });

    this.ws.subscribe('zfs.pool.scan').subscribe(res => {
      if(res && res.fields.scan.function.indexOf('RESILVER') > -1 ) {
        this.resilveringDetails = res.fields;
        this.showResilvering = true;
      }
    });

    setInterval(() => {
      if(this.resilveringDetails && this.resilveringDetails.scan.state == 'FINISHED') {
        this.showResilvering = false;
        this.resilveringDetails = '';
      }
    }, 2500);
  }

  ngOnDestroy() {
    if (typeof (this.interval) !== 'undefined') {
      clearInterval(this.interval);
    }

    this.continuosStreaming.unsubscribe();
  }

  startTour() {
    hopscotch.startTour(this.tour.startTour(this.router.url));
    localStorage.setItem(this.router.url, 'true');
  }

  setLang(lang) {
    this.language.currentLang = lang;
    this.onLangChange.emit(this.language.currentLang);
  }

  changeTheme(theme) {
    this.themeService.changeTheme(theme);
  }

  toggleNotific() {
    this.notificPanel.toggle();
  }

  toggleSidenav() {
    this.sidenav.toggle();
  }

  toggleCollapse() {
    let appBody = document.body;

    domHelper.toggleClass(appBody, 'collapsed-menu');
    domHelper.removeClass(document.getElementsByClassName('has-submenu'), 'open');
  }

  onShowAbout() {
    let dialogRef = this.dialog.open(AboutModalDialog, {});

    dialogRef.afterClosed().subscribe(result => {
      // The dialog was closed
    });
  }

  signOut() {
    this.idle.ngOnDestroy();
    this.translate.get('Log out').subscribe((logout: string) => {
      this.translate.get("Log out of the WebUI?").subscribe((logout_prompt) => {
        this.dialogService.confirm("Log Out", "Log out of the WebUI?", true).subscribe((res) => {
          if (res) {
            this.ws.logout();
          }
        });
      });
    });
  }

  onShutdown() {
    this.translate.get('Shut down').subscribe((shutdown: string) => {
      this.translate.get('Are you sure you wish to shut down the system?').subscribe((shutdown_prompt: string) => {
        this.dialogService.confirm(shutdown, shutdown_prompt).subscribe((res) => {
          if (res) {
            this.router.navigate(['/others/shutdown']);
          }
        });
      });
    });
  }

  onReboot() {
    this.translate.get('Restart').subscribe((reboot: string) => {
      this.translate.get('Are you sure you wish to reboot the system?').subscribe((reboot_prompt: string) => {
        this.dialogService.confirm(reboot, reboot_prompt).subscribe((res) => {
          if (res) {
            this.router.navigate(['/others/reboot']);
          }
        });
      });
    });
  }

  showReplicationStatus() {
    this.rest.get('storage/replication/', {}).subscribe(res => {
      let idx = res.data.forEach(x => {
        if(typeof(x.repl_status) !== "undefined" &&
            x.repl_status != null && x.repl_status.indexOf('Sending') > -1 && x.repl_enabled == true) {
          this.showReplication = true;
          this.replicationDetails = x;
        }
      });
    }, err => {
      console.log(err);
    })
  }

  showReplicationDetails(){
    this.translate.get('Ok').subscribe((ok: string) => {
      this.snackBar.open(this.replicationDetails.repl_status.toString(), ok);
    });
  }

  showResilveringDetails() {
    this.translate.get('Ok').subscribe((ok: string) => {
      this.snackBar.open(`Resilvering ${this.resilveringDetails.name} - ${Math.ceil(this.resilveringDetails.scan.percentage)}%`, ok);
    });
  }
}
