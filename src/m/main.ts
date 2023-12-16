/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2018-2022 TypeFox GmbH (http://www.typefox.io). All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
import { WebSocketServer } from 'ws';
import express from 'express';
/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2018-2022 TypeFox GmbH (http://www.typefox.io). All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
import path, { resolve } from 'path';
import { IncomingMessage, Server } from 'http';
import { URL } from 'url';
import { Socket } from 'net';
import {
  IWebSocket,
  WebSocketMessageReader,
  WebSocketMessageWriter,
} from 'vscode-ws-jsonrpc';
import {
  createConnection,
  createServerProcess,
  forward,
} from 'vscode-ws-jsonrpc/server';
import {
  Message,
  InitializeRequest,
  InitializeParams,
} from 'vscode-languageserver';
export const runMatlabServer = () => {
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
  const server: Server = app.listen(30003);
  // create the web socket
  const wss = new WebSocketServer({
    noServer: true,
    perMessageDeflate: false,
  });
  upgradeWsServer({
    serverName: 'm',
    pathName: '/matlab',
    server,
    wss,
  });
};
export const upgradeWsServer = (config: {
  serverName: string;
  pathName: string;
  server: Server;
  wss: WebSocketServer;
  driver?: string;
}) => {
  config.server.on(
    'upgrade',
    (request: IncomingMessage, socket: Socket, head: Buffer) => {
      const baseURL = `http://${request.headers.host}/`;
      const pathName = request.url
        ? new URL(request.url, baseURL).pathname
        : undefined;
      if (pathName === config.pathName) {
        config.wss.handleUpgrade(request, socket, head, (webSocket) => {
          const socket: IWebSocket = {
            send: (content) =>
              webSocket.send(content, (error) => {
                if (error) {
                  throw error;
                }
              }),
            onMessage: (cb) =>
              webSocket.on('message', (data) => {
                console.log(data.toString());
                cb(data);
              }),
            onError: (cb) => webSocket.on('error', cb),
            onClose: (cb) => webSocket.on('close', cb),
            dispose: () => webSocket.close(),
          };
          // launch the server when the web socket is opened
          if (webSocket.readyState === webSocket.OPEN) {
            launchLanguageServer(config.serverName, socket);
          } else {
            webSocket.on('open', () => {
              launchLanguageServer(config.serverName, socket);
            });
          }
        });
      }
    },
  );
};
/**
 * start the language server inside the current process
 */
export const launchLanguageServer = (
  serverName: string,
  socket: IWebSocket,
) => {
  // start the language server as an external process

  const clangdPath = 'C:/Program Files/LLVM/bin/clangd.exe';

  const reader = new WebSocketMessageReader(socket);
  const writer = new WebSocketMessageWriter(socket);
  const socketConnection = createConnection(reader, writer, () =>
    socket.dispose(),
  );
  const serverConnection = createServerProcess(serverName, 'node', [
    '--inspect', path.join(process.cwd(), 'dist/mindex.js'), '--stdio', 
  ]);
  if (serverConnection) {
    forward(socketConnection, serverConnection, (message) => {
      if (Message.isRequest(message)) {
        console.log(`${serverName} Server received:`);
        console.log(message);

        if (message.method === InitializeRequest.type.method) {
          const initializeParams = message.params as InitializeParams;
          initializeParams.processId = process.pid;
        }
      }
      if (Message.isResponse(message)) {
        console.log(`${serverName} Server sent:`);
        console.log(message);
      }

      return message;
    });
  }
};
runMatlabServer();
