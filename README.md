# TP Games Lib

[![Build/Test](https://github.com/Toilet-Paper-Games/core/actions/workflows/test.yml/badge.svg)](https://github.com/Toilet-Paper-Games/core/actions/workflows/test.yml)
[![Node.js Package](https://github.com/Toilet-Paper-Games/core/actions/workflows/npm-publish-github-packages.yml/badge.svg)](https://github.com/Toilet-Paper-Games/core/actions/workflows/npm-publish-github-packages.yml)

This exists as a library used for creating games for the TP Games platform.

This is imported to the game template and used primary to interface with the connection bridge and to get information sent to the platform along with communicating between the controllers and host devices.

## Delivery confirmation

Game messages remain fire-and-forget by default. Pass delivery options to wait until
the receiving game iframe acknowledges a message:

```ts
const receipt = await controller.sendGameMessage(
  { action: 'buzz' },
  { timeoutMs: 3_000 },
);

const receipts = await hoster.broadcastGameMessage(
  { notice: 'Vote now' },
  { timeoutMs: 3_000 },
);
```

The same options are available on `hoster.sendGameMessage` and
`smartPlayer.sendMessage`. Confirmed broadcasts wait for every connected recipient.
Failures reject with `GameMessageDeliveryError`; inspect its `code` for `timeout`,
`recipient-unavailable`, or `communicator-destroyed`.

Delivery confirmation requires a compatible core version in both the sending and
receiving game iframe. `__tpgCoreDelivery` is reserved for the internal
acknowledgement protocol and should not be used as a top-level game payload field.
