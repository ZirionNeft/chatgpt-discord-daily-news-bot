import type { CommandStorageOptions } from '#common/bot/command/types.js';
import type { BaseInteractor } from '#common/bot/interactor/base-interactor.abstract.js';
import type { Type } from '@zirion/ioc';

export type InteractorsStorage = Map<
  string,
  Type<BaseInteractor>
>

export type CommandsStorage = Map<
  string,
  CommandStorageOptions
>
