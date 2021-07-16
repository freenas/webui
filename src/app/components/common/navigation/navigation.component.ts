import {
  Component, EventEmitter, OnInit, Output,
} from '@angular/core';
import { Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import * as _ from 'lodash';
import { filter } from 'rxjs/operators';
import { ViewControllerComponent } from 'app/core/components/view-controller/view-controller.component';
import { ProductType } from 'app/enums/product-type.enum';
import { SysInfoEvent } from 'app/interfaces/events/sys-info-event.interface';
import { WebSocketService } from 'app/services';
import { NavigationService } from 'app/services/navigation/navigation.service';

@UntilDestroy()
@Component({
  selector: 'navigation',
  templateUrl: './navigation.template.html',
})
export class NavigationComponent extends ViewControllerComponent implements OnInit {
  hasIconTypeMenuItem: boolean;
  iconTypeMenuTitle: string;
  menuItems: any[];
  menuList = document.getElementsByClassName('top-level');
  isHighlighted: string;

  @Output() stateChange: EventEmitter<any> = new EventEmitter();
  @Output() menuToggled: EventEmitter<any> = new EventEmitter();
  @Output() menuClosed: EventEmitter<any> = new EventEmitter();

  constructor(
    private navService: NavigationService, private router: Router, private ws: WebSocketService,
  ) {
    super();
  }

  ngOnInit(): void {
    this.iconTypeMenuTitle = this.navService.iconTypeMenuTitle;
    // Loads menu items from NavigationService
    this.navService.menuItems$.pipe(untilDestroyed(this)).subscribe((menuItem) => {
      this.ws.call('failover.licensed').pipe(untilDestroyed(this)).subscribe((hasFailover) => {
        _.find(_.find(menuItem, { state: 'system' }).sub, { state: 'failover' }).disabled = !hasFailover;
      });
      if (window.localStorage.getItem('product_type') === ProductType.Enterprise) {
        this.ws
          .call('system.feature_enabled', ['VM'])
          .pipe(filter((vmsEnabled) => !vmsEnabled))
          .pipe(untilDestroyed(this)).subscribe(() => {
            _.find(menuItem, { state: 'vm' }).disabled = true;
          });

        for (let i = 0; i < this.navService.enterpriseFeatures.length; i++) {
          const targetMenu = this.navService.enterpriseFeatures[i];
          const enterpriseItem = (_.find(_.find(menuItem, { state: targetMenu.menu }).sub, { state: targetMenu.sub }));
          if (enterpriseItem) {
            enterpriseItem.disabled = false;
          }
        }
      }

      this.core.register({
        observerClass: this,
        eventName: 'SysInfo',
      }).pipe(untilDestroyed(this)).subscribe((evt: SysInfoEvent) => {
        if (evt.data.features.enclosure) {
          for (let i = 0; i < this.navService.hardwareFeatures.length; i++) {
            const targetMenu = this.navService.hardwareFeatures[i];
            const found = _.find(_.find(menuItem, { state: targetMenu.menu }).sub, { state: targetMenu.sub });
            if (found) found.disabled = false;
          }
        }
      });

      this.core.emit({ name: 'SysInfoRequest', sender: this });

      this.menuItems = menuItem;
      // Checks item list has any icon type.
      this.hasIconTypeMenuItem = !!this.menuItems.filter((item) => item.type === 'icon').length;
    });
  }

  toggleMenu(state: any, sub: any): void {
    this.menuToggled.emit([state, sub]);
  }

  closeMenu(): void {
    this.menuClosed.emit();
  }

  updateHighlightedClass(state: any): void {
    this.isHighlighted = state;
  }
}
