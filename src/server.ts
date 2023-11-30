/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2018-2022 TypeFox GmbH (http://www.typefox.io). All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
import { WebSocketServer } from 'ws';
import { IncomingMessage, Server } from 'http';
import express from 'express';
import { upgradeWsServer } from './server-commons';

let server: Server;
let wss: WebSocketServer;
export const runClangdServer = () => {
  process.on('uncaughtException', function (err: any) {
    console.error('Uncaught Exception: ', err.toString());
    if (err.stack) {
      console.error(err.stack);
    }
  });

  // create the express application
  const app = express();
  // server the static content, i.e. index.html

  // start the server
  server = app.listen(30002);
  // create the web socket
  wss = new WebSocketServer({
    noServer: true,
    perMessageDeflate: false,
    clientTracking: true,
    verifyClient: (
      clientInfo: { origin: string; secure: boolean; req: IncomingMessage },
      callback,
    ) => {
      callback(true);
    },
  });

  upgradeWsServer({
    serverName: 'clangd',
    pathName: '/clangd',
    server,
    wss,
  });
};
runClangdServer();
