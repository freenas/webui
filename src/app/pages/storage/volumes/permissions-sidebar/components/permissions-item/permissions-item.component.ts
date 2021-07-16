import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import {
  PermissionItem,
  PermissionsItemType,
} from 'app/pages/storage/volumes/permissions-sidebar/interfaces/permission-item.interface';

@Component({
  selector: 'app-permissions-item',
  templateUrl: 'permissions-item.component.html',
  styleUrls: ['./permissions-item.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PermissionsItemComponent {
  @Input() item: PermissionItem;

  readonly PermissionsItem = PermissionsItemType;
}
