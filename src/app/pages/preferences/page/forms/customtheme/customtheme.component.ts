import {
  ApplicationRef, Component, Injector, OnInit, AfterViewInit, OnChanges, OnDestroy,
} from '@angular/core';
import { Router } from '@angular/router';
import * as _ from 'lodash';
import { FieldConfig } from 'app/pages/common/entity/entity-form/models/field-config.interface';
import { FieldSet } from 'app/pages/common/entity/entity-form/models/fieldset.interface';
import { FormConfig } from 'app/pages/common/entity/entity-form/entity-form-embedded.component';
import { RestService, WebSocketService } from 'app/services/';
import { ThemeService, Theme } from 'app/services/theme/theme.service';
import { CoreEvent, CoreService } from 'app/core/services/core.service';
import { Subject } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { DialogService } from 'app/services/dialog.service';
import { T } from 'app/translate-marker';

interface FormSnapshot {
  theme: any;
  baseTheme?: string;
}

@Component({
  selector: 'custom-theme',
  templateUrl: './customtheme.component.html',
  styleUrls: ['./customtheme.component.css'],
})
export class CustomThemeComponent implements OnInit, AfterViewInit, OnChanges, OnDestroy {
  saveSubmitText = T('Submit');
  actionButtonsAlign = 'left';
  customThemeForm: Subject<CoreEvent> = new Subject();// formerly known as target
  loadValuesForm: Subject<CoreEvent> = new Subject();// formerly known as target
  private _baseTheme: any; //= this.themeService.activeTheme;
  private _globalPreview = true;
  baseThemes: Theme[];
  snapshot: FormSnapshot;
  customThemeFormConfig: FormConfig = {};// see if we can use this instead of passing this whole component in
  protected isEntity = true; // was true
  hiddenFieldSets: string[] = ['Colors'];
  currentTab = 'General';
  scrollContainer: HTMLElement;
  goBack = true;

  get flexForm() {
    return this._globalPreview ? '432px' : '100%';
  }

  // EXAMPLE THEME
  values: Theme = {
    name: 'New Theme',
    description: '',
    label: '',
    labelSwatch: '',
    accentColors: ['violet', 'blue', 'magenta', 'cyan', 'red', 'green', 'orange', 'yellow'],
    topbar: '',
    primary: '',
    accent: '',
    bg1: '',
    bg2: '',
    fg1: '',
    fg2: '',
    'alt-bg1': '',
    'alt-bg2': '',
    'alt-fg1': '',
    'alt-fg2': '',
    yellow: '',
    orange: '',
    red: '',
    magenta: '',
    violet: '',
    blue: '',
    cyan: '',
    green: '',
  };

  private colors: string[] = ['bg1', 'bg2', 'fg1', 'fg2', 'alt-bg1', 'alt-bg2', 'alt-fg1', 'alt-fg2', 'yellow', 'orange', 'red', 'magenta', 'violet', 'blue', 'cyan', 'green'];
  // Had to hard code colorVars because concatenated strings get sanitized
  private colorVars: string[] = [
    'var(--bg1)',
    'var(--bg2)',
    'var(--fg1)',
    'var(--fg2)',
    'var(--alt-bg1)',
    'var(--alt-bg2)',
    'var(--alt-fg1)',
    'var(--alt-fg2)',
    'var(--yellow)',
    'var(--orange)',
    'var(--red)',
    'var(--magenta)',
    'var(--violet)',
    'var(--blue)',
    'var(--cyan)',
    'var(--green)',
  ];
  private colorOptions: any[] = [];
  private colorWidth = '180px';
  fieldConfig: FieldConfig[] = [];

  fieldSetDisplay = 'no-margins';// default | carousel | stepper
  fieldSets: FieldSet[] = [
    {
      name: 'General',
      label: false,
      class: 'general',
      width: '300px',
      config: [
        {
          type: 'input',
          name: 'name',
          width: '100%',
          placeholder: T('Custom Theme Name'),
          required: true,
          tooltip: T('Enter a name for the new theme.'),
        },
        {
          type: 'input',
          name: 'label',
          width: '100%',
          placeholder: T('Menu Label'),
          required: true,
          tooltip: T('Shortened theme name. Used when listing the theme \
                    in Preferences.'),
        },
        // Not using this now, but theme preview breaks if it isn't here...
        {
          type: 'select',
          name: 'labelSwatch',
          width: '100%',
          placeholder: T('Menu Swatch'),
          required: false,
          isHidden: true,
          options: this.colorOptions,
          tooltip: T('Choose the color to display next to the Menu Label \
                    in the Favorites menu.'),
          class: 'inline',

        },
        {
          type: 'input',
          name: 'description',
          width: '100%',
          placeholder: T('Description'),
          tooltip: T('Notes or identifiers about the theme.'),
        },
        {
          type: 'select',
          name: 'primary',
          width: '100%',
          placeholder: T('Choose Primary'),
          required: true,
          options: this.colorOptions,
          tooltip: T('Choose the primary color for the theme.'),
          class: 'inline',
        },
        {
          type: 'select',
          name: 'accent',
          width: '100%',
          placeholder: T('Choose Accent'),
          required: true,
          options: this.colorOptions,
          tooltip: T('Choose the accent color for the theme.'),
          class: 'inline',
        },
        {
          type: 'select',
          name: 'topbar',
          width: '100%',
          placeholder: T('Choose Topbar'),
          required: true,
          options: this.colorOptions,
          tooltip: T('Choose a topbar color.'),
          class: 'inline',
        },
      ],
    },
    {
      name: 'Colors',
      class: 'color-palette',
      label: false,
      width: 'calc(100% - 300px)',
      config: [
        {
          type: 'colorpicker',
          name: 'bg1',
          width: this.colorWidth,
          placeholder: T('Background 1'),
          tooltip: T('Click the swatch to pick a color or enter a color \
                   hex value.'),
          class: 'inline',
        },
        {
          type: 'colorpicker',
          name: 'bg2',
          width: this.colorWidth,
          placeholder: T('Background 2'),
          required: true,
          tooltip: T('Click the swatch to pick a color or enter a color \
                    hex value.'),
          class: 'inline',
        },
        {
          type: 'colorpicker',
          name: 'fg1',
          width: this.colorWidth,
          placeholder: T('Foreground 1'),
          required: true,
          tooltip: T('Click the swatch to pick a color or enter a color \
                    hex value.'),
          class: 'inline',
        },
        {
          type: 'colorpicker',
          name: 'fg2',
          width: this.colorWidth,
          placeholder: T('Foreground 2'),
          required: true,
          tooltip: T('Click the swatch to pick a color or enter a color \
                    hex value.'),
          class: 'inline',
        },
        {
          type: 'colorpicker',
          name: 'alt-bg1',
          width: this.colorWidth,
          placeholder: T('Alt Background 1'),
          required: true,
          tooltip: T('Click the swatch to pick a color or enter a color \
                    hex value.'),
          class: 'inline',
        },
        {
          type: 'colorpicker',
          name: 'alt-bg2',
          width: this.colorWidth,
          placeholder: T('Alt Background 2'),
          required: true,
          tooltip: T('Click the swatch to pick a color or enter a color \
                    hex value.'),
          class: 'inline',
        },
        {
          type: 'colorpicker',
          name: 'alt-fg1',
          width: this.colorWidth,
          placeholder: T('Alt Foreground 1'),
          required: true,
          tooltip: T('Click the swatch to pick a color or enter a color \
                    hex value.'),
          class: 'inline',
        },
        {
          type: 'colorpicker',
          name: 'alt-fg2',
          width: this.colorWidth,
          placeholder: T('Alt Foreground 2'),
          required: true,
          tooltip: T('Click the swatch to pick a color or enter a color \
                    hex value.'),
          class: 'inline',
        },
        {
          type: 'colorpicker',
          name: 'yellow',
          width: this.colorWidth,
          placeholder: T('Yellow'),
          required: true,
          tooltip: T('Click the swatch to pick a color or enter a color \
                    hex value.'),
          class: 'inline',
        },
        {
          type: 'colorpicker',
          name: 'orange',
          width: this.colorWidth,
          placeholder: T('Orange'),
          required: true,
          tooltip: T('Click the swatch to pick a color or enter a color \
                    hex value.'),
          class: 'inline',
        },
        {
          type: 'colorpicker',
          name: 'red',
          width: this.colorWidth,
          placeholder: T('Red'),
          required: true,
          tooltip: T('Click the swatch to pick a color or enter a color \
                    hex value.'),
          class: 'inline',
        },
        {
          type: 'colorpicker',
          name: 'magenta',
          width: this.colorWidth,
          placeholder: T('Magenta'),
          required: true,
          tooltip: T('Click the swatch to pick a color or enter a color \
                    hex value.'),
          class: 'inline',
        },
        {
          type: 'colorpicker',
          name: 'violet',
          width: this.colorWidth,
          placeholder: T('Violet'),
          required: true,
          tooltip: T('Click the swatch to pick a color or enter a color \
                    hex value.'),
          class: 'inline',
        },
        {
          type: 'colorpicker',
          name: 'blue',
          width: this.colorWidth,
          placeholder: T('Blue'),
          required: true,
          tooltip: T('Click the swatch to pick a color or enter a color \
                    hex value.'),
          class: 'inline',
        },
        {
          type: 'colorpicker',
          name: 'cyan',
          width: this.colorWidth,
          placeholder: T('Cyan'),
          required: true,
          tooltip: T('Click the swatch to pick a color or enter a color \
                    hex value.'),
          class: 'inline',
        },
        {
          type: 'colorpicker',
          name: 'green',
          width: this.colorWidth,
          placeholder: T('Green'),
          required: true,
          tooltip: T('Click the swatch to pick a color or enter a color \
                    hex value.'),
          class: 'inline',
        },
      ],
    },
  ];

  get baseTheme() {
    return this._baseTheme;
  }

  set baseTheme(name: string) {
    this._baseTheme = name;
    const theme = this.themeService.findTheme(name);
    this.snapshot = { theme, baseTheme: this._baseTheme };
    this.loadValues(name);
    this.updatePreview(theme);
    if (this.globalPreview) {
      this.updateGlobal(this.snapshot);
    }
  }

  get globalPreview() {
    return this._globalPreview;
  }

  set globalPreview(state: boolean) {
    if (state) {
      this.updateGlobal(this.snapshot);
    } else {
      this.updateGlobal();
    }
    this._globalPreview = state;
  }

  constructor(
    protected router: Router,
    protected rest: RestService,
    protected ws: WebSocketService,
    private core: CoreService,
    private dialog: DialogService,
    protected matdialog: MatDialog,
    protected _injector: Injector,
    protected _appRef: ApplicationRef,
    public themeService: ThemeService,
  ) {}

  ngOnInit() {
    this.scrollContainer = document.querySelector('.rightside-content-hold ');// this.container.nativeElement;
    this.scrollContainer.style.overflow = 'hidden';
    this.init();
  }

  ngAfterViewInit() {
    this.updateGlobal();
  }

  ngOnChanges(changes) {
  }

  ngOnDestroy() {
    this.core.unregister({ observerClass: this });
    this.globalPreview = true;
    this.updateGlobal();
    this.scrollContainer.style.overflow = 'auto';
  }

  init() {
    this.baseThemes = this.themeService.allThemes;
    this.setupColorOptions(this.colors);

    if (this.themeService.globalPreview) {
      const data = this.themeService.globalPreviewData;
      this.globalPreview = true;
      this.snapshot = { theme: data.theme };// ignore basetheme
      this.loadValues();
    } else {
      this.baseTheme = this.themeService.activeTheme;
      this.loadValues(this.themeService.activeTheme);
    }

    this.core.register({ observerClass: this, eventName: 'ThemeListsChanged' }).subscribe((evt: CoreEvent) => {
      this.baseThemes = this.themeService.allThemes;
      const theme = this.themeService.currentTheme();
      this.baseTheme = theme.name;
    });

    this.customThemeForm.subscribe((evt: CoreEvent) => {
      switch (evt.name) {
        case 'FormSubmitted':
          const valid: boolean = this.validateForm(evt.data);
          if (valid) {
            evt.data.labelSwatch = evt.data.primary.slice(6, -1);
            evt.data.accentColors = ['blue', 'orange', 'green', 'violet', 'cyan', 'magenta', 'yellow', 'red'];
            this.core.emit({ name: 'AddCustomThemePreference', data: evt.data });
            this.globalPreview = false;
            this.updateGlobal();
            this.router.navigate(['ui-preferences']);
          }
          break;
        case 'FormCancelled':
          this.globalPreview = false;
          this.updateGlobal();
          this.router.navigate(['ui-preferences']);
          break;
        case 'FormGroupValueChanged':
        case 'UpdatePreview':
          this.snapshot = { theme: evt.data, baseTheme: this.baseTheme };
          if (this.globalPreview) {
            setTimeout(() => {
              this.updateGlobal(this.snapshot);
            });
          }
          this.updatePreview(evt.data);
          break;
        default:
          break;
      }
    });
    this.generateFieldConfig();
  }

  afterInit(entityForm: any) {
  }

  setupColorOptions(palette) {
    for (const color in palette) {
      this.colorOptions.push({ label: this.colors[color], value: this.colorVars[color] });
    }

    // Add Black White and Gray options
    this.colorOptions.push({ label: 'black', value: 'var(--black)' });
    // this.colorOptions.push({label:"white", value:"var(--white)"});
    this.colorOptions.push({ label: 'grey', value: 'var(--grey)' });
  }

  loadValues(themeName?: string) {
    const values = { ...this.values };
    let theme: Theme;
    if (this.globalPreview) {
      theme = this.snapshot.theme;
    } else if (!themeName) {
      theme = this.themeService.currentTheme();
    } else {
      theme = this.themeService.findTheme(themeName);
    }

    const ct = { ...theme };
    const keys = Object.keys(ct);
    // let palette = keys.splice(0,4);
    const palette = keys.filter((v) => v != 'name' && v != 'label' && v != 'labelSwatch' && v != 'description' && v != '');

    palette.forEach((color) => {
      values[color] = ct[color];
    });

    this.values = values;
  }

  updatePreview(theme: Theme) {
    const palette = Object.keys(theme);
    palette.splice(0, 5);

    palette.forEach((color) => {
      const swatch = theme[color];
      (<any>document).querySelector('#theme-preview').style.setProperty(`--${color}`, theme[color]);
    });
  }

  updateGlobal(snapshot?: FormSnapshot) {
    if (snapshot) {
      // Turn it on in theme service
      this.core.emit({ name: 'GlobalPreviewChanged', data: snapshot });
    } else {
      // turn it off in theme service
      this.core.emit({ name: 'GlobalPreviewChanged' });
    }
  }

  generateFieldConfig() {
    for (const i in this.fieldSets) {
      for (const ii in this.fieldSets[i].config) {
        this.fieldConfig.push(this.fieldSets[i].config[ii]);
      }
    }
  }

  validateForm(data: any) {
    const messages: string[] = [];
    Object.keys(this.fieldSets).forEach((set) => {
      const fieldset = this.fieldSets[set];
      for (let i = 0; i < fieldset.config.length; i++) {
        const field = fieldset.config[i];

        // Check for required fields
        if (field.required && !data[field.name]) {
          messages.push(field.placeholder + T(' is a required field.'));
        } else if (field.required) {
          // console.warn(field.name);
        } else {
          // console.log(field.name);
        }
      }
    });
    // Check for duplicate theme names and labels
    const dupeName = this.isDuplicateOf('name', data.name);
    if (dupeName) {
      messages.push(T('This name is already being used by an existing theme. Please choose a new name.'));
    }

    const dupeLabel = this.isDuplicateOf('label', data.label);
    if (dupeLabel) {
      messages.push(T('Another theme is using this label. Please enter a new label.'));
    }
    if (messages.length == 0) {
      return true;
    }

    this.invalidDialog(messages);

    return false;
  }

  isDuplicateOf(key: string, value: any): Theme {
    for (let i = 0; i < this.baseThemes.length; i++) {
      if (this.baseThemes[i][key] == value) {
        return this.baseThemes[i];
      }
    }
  }

  invalidDialog(messages: string[]) {
    let message = '';

    for (let i = 0; i < messages.length; i++) {
      const num = i + 1;
      message += ` ${messages[i]}`;
    }

    // Info(T("Deleted Recovery Key"), T("Successfully deleted recovery key for volume ") + row1.name)
    this.dialog.Info(T('Form Invalid'), T(message)).subscribe((res) => {
      // console.log(res);
    });
  }

  hideFieldSet(name: string) {
    if (name == 'All') {
      this.currentTab = 'Preview';
      this.hiddenFieldSets = ['General', 'Colors'];
      return;
    }

    this.hiddenFieldSets = [name];
    this.currentTab = name == 'Colors' ? 'General' : 'Colors';
  }
}
