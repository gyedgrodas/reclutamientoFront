import { ability } from './ability';

declare module 'vue' {
  interface ComponentCustomProperties {
    $ability: ability;
    $can(this: this, ...args: Parameters<this['$ability']['can']>): boolean;
  }
}
