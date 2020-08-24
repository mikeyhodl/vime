import { openWormhole } from 'stencil-wormhole';
import { ComponentInterface } from '@stencil/core';
import { PlayerProp } from './PlayerProp';
import { deferredPromise } from '../../../utils/promise';
import { findRootPlayer } from './utils';
import { PlayerEvent } from './PlayerEvent';

export const withPlayerContext = (
  Component: ComponentInterface,
  props: PlayerProp[],
) => openWormhole(Component as any, props);

export const withCustomPlayerContext = (
  ref: HTMLElement,
  props: PlayerProp[],
  updater: (prop: keyof typeof PlayerProp, value: any) => void,
  onConnected?: () => void,
) => {
  const consumer = Symbol.for(ref.nodeName);
  const player = findRootPlayer(ref);
  const onOpen = deferredPromise();

  let disconnect: (() => void) | undefined;
  onOpen.promise.then((forceDisconnect) => {
    onConnected?.();
    disconnect = forceDisconnect;
  });

  const connect = () => {
    ref.dispatchEvent(new CustomEvent('openWormhole', {
      bubbles: true,
      composed: true,
      detail: {
        consumer,
        fields: props,
        updater,
        onOpen,
      },
    }));

    player.removeEventListener(PlayerEvent.mounted, connect);
  };

  if (!player.mounted) {
    player.addEventListener(PlayerEvent.mounted, connect);
  } else {
    connect();
  }

  return () => {
    disconnect?.();
  };
};
