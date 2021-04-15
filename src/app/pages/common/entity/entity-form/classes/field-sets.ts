import { FieldConfig } from '../models/field-config.interface';
import { FieldSet } from '../models/fieldset.interface';

export class FieldSets {
  readonly advancedDividers = this._init
    .filter((set) => !set.divider && set.name.indexOf('divider') > -1)
    .map((set) => set.name);

  readonly advancedFields = this._init
    .filter((set) => !set.label)
    .map((set) => set.config || [])
    .reduce((flatList, configs) => flatList.concat(configs), [])
    .map((config) => config.name);

  readonly advancedSets = this._init
    .filter((set) => !set.label && set.name.indexOf('divider') === -1)
    .map((set) => set.class);

  /* Make a local copy of our initial state */
  private readonly _fieldSets = [...this._init];

  constructor(private readonly _init: FieldSet[] = []) {}

  config(configName: string) {
    return this.list()
      .find(
        (set) => set.config && set.config.some((config) => config.name === configName),
      )
      .config.find((config) => config.name === configName);
  }

  hideConfig(configName: string): this {
    this.config(configName).isHidden = true;
    return this;
  }

  configs(): FieldConfig[] {
    return this.list()
      .reduce((configList, set) => configList.concat(set.config), [])
      .filter((c) => !!c);
  }

  list(): FieldSet[] {
    return this._fieldSets;
  }

  showConfig(configName: string): this {
    this.config(configName).isHidden = false;
    return this;
  }

  toggleSets(setClasses: string[] = this.advancedSets): this {
    this._fieldSets
      .filter((set) => setClasses.some((c) => c === set.class))
      .forEach((set) => (set.label = !set.label));
    return this;
  }

  toggleDividers(divNames: string[] = this.advancedDividers): this {
    this._fieldSets
      .filter((set) => divNames.some((name) => name === set.name))
      .forEach((set) => (set.divider = !set.divider));
    return this;
  }

  /**
   * Like showConfig or hideConfig, but for times when the isHidden value
   * is computed at runtime.
   */
  toggleConfigVisibility(configName: string, isHidden: boolean): this {
    this.config(configName).isHidden = isHidden;
    return this;
  }
}
