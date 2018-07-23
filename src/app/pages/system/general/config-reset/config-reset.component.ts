import { Component } from '@angular/core';
import { Location } from '@angular/common';
import { Subscription } from 'rxjs';
import { Observable } from 'rxjs/Observable';
import { MatSnackBar } from '@angular/material';
import { RestService, WebSocketService } from '../../../../services';
import { Router, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'config-reset',
  templateUrl: './config-reset.component.html'
})
export class ConfigResetComponent {

  public route_success: string[] = ['system', 'general'];
  constructor(protected router: Router, protected ws: WebSocketService, private _location: Location, public snackBar: MatSnackBar) {}

  _displayTime() {

  }
  doSubmit() {
    this.ws.call('system.reboot', [{ delay: 5 }]).subscribe((res) => {
      // this.countDown = setInterval( () => {if(this.count>0){this.count -= 1}}, 1000);
      this.openSnackBar("System will reboot in 5 seconds", "Rebooting");
    });;
  }

  openSnackBar(message: string, action: string) {
    this.snackBar.open(message, action, {
      duration: 5000
    });
  }

  goBack() {
    this.router.navigate(new Array('').concat(this.route_success));
  }
}
