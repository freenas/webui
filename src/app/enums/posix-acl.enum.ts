import { T } from 'app/translate-marker';

export enum PosixAclTag {
  UserObject = 'USER_OBJ',
  GroupObject = 'GROUP_OBJ',
  User = 'USER',
  Group = 'GROUP',
  Other = 'OTHER',
  Mask = 'MASK',
}

export const posixAclTagLabels = new Map<PosixAclTag, string>([
  [PosixAclTag.User, T('User')],
  [PosixAclTag.Group, T('Group')],
  [PosixAclTag.Other, T('Other')],
  [PosixAclTag.GroupObject, T('Group Obj')],
  [PosixAclTag.UserObject, T('User Obj')],
  [PosixAclTag.Mask, T('Mask')],
]);

export enum PosixPermission {
  Read = 'READ',
  Write = 'WRITE',
  Execute = 'EXECUTE',
}
