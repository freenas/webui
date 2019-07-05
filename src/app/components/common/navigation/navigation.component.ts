import {Component, OnInit, Output, EventEmitter} from '@angular/core';
import { NavigationService } from "../../../services/navigation/navigation.service";
import { WebSocketService } from "../../../services/";
import { DocsService } from "../../../services/docs.service";
import {Router} from "@angular/router";
import * as _ from 'lodash';
import * as Ps from 'perfect-scrollbar';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'navigation',
  templateUrl: './navigation.template.html'
})
export class NavigationComponent implements OnInit {
  hasIconTypeMenuItem;
  iconTypeMenuTitle:string;
  menuItems:any[];
  @Output('onStateChange') onStateChange: EventEmitter<any> = new EventEmitter();

  constructor(private navService: NavigationService, private router: Router, private ws: WebSocketService, private docsService: DocsService) {}

  ngOnInit() {
    this.iconTypeMenuTitle = this.navService.iconTypeMenuTitle;
    // Loads menu items from NavigationService
    this.navService.menuItems$.subscribe(menuItem => {
      this.ws.call('ipmi.is_loaded').subscribe((res)=>{
        if(!res){
           _.find(_.find(menuItem,
            {name : "Network"}).sub,
            {name : "IPMI"}).disabled = true;
        }
      });
      this.ws.call('multipath.query').subscribe((res)=>{
        if (!res || res.length === 0) {
          _.find(_.find(menuItem, {state : "storage"}).sub, {state : "multipaths"}).disabled = true;
        }
      });
      if (window.localStorage.getItem('is_freenas') === 'false') {
        this.ws.call('failover.licensed').subscribe((is_ha) => {
          if (is_ha) {
            _.find(_.find(menuItem,
              {name : "System"}).sub,
              {name : "Failover"}).disabled = false;
          }
        });

        this.ws
          .call("system.feature_enabled", ["VM"])
          .pipe(filter(vmsEnabled => !vmsEnabled))
          .subscribe(() => {
            _.find(menuItem, { state: "vm" }).disabled = true;
          });

        for(let i = 0; i < this.navService.turenasFeatures.length; i++) {
          const targetMenu = this.navService.turenasFeatures[i];
          _.find(_.find(menuItem, { state: targetMenu.menu }).sub, { state : targetMenu.sub}).disabled = false;
          // special case for proactive support
          if (targetMenu.sub === 'proactivesupport') {
            this.ws.call('support.is_available').subscribe((res) => {
              if (res !== true) {
                _.find(_.find(menuItem, { state: targetMenu.menu }).sub, { state : targetMenu.sub}).disabled = true;
              }
            });
          }
        }

        this.ws.call('system.info').subscribe((res) => {
          if (res.license.features.indexOf('JAILS') === -1) {
            _.find(menuItem, {state : "plugins"}).disabled = true;
            _.find(menuItem, {state : "jails"}).disabled = true;
          }
        })
      }

      this.menuItems = menuItem;
      //Checks item list has any icon type.
      this.hasIconTypeMenuItem = !!this.menuItems.filter(item => item.type === 'icon').length;

      // set the guide url
      this.ws.call('system.info').subscribe((res) => {
        if (res.version) {
            window.localStorage.setItem('running_version', res['version']);
            const docUrl = this.docsService.docReplace("--docurl--");
            const guide = _.find(menuItem, {name: 'Guide'});
            guide.state = docUrl;
        }
      });
    });
  }

  // Workaround to keep scrollbar displaying as needed
  updateScroll() {
    let navigationHold = document.getElementById('scroll-area');
    setTimeout(() => {
      Ps.update(navigationHold);
    }, 500);
  }
}
