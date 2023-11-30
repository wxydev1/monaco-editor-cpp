import getConfigurationServiceOverride from '@codingame/monaco-vscode-configuration-service-override';
import * as monaco from 'monaco-editor';
import { editor } from 'monaco-editor';
import 'monaco-editor/esm/vs/basic-languages/cpp/cpp.contribution';
import { MonacoLanguageClient, initServices } from 'monaco-languageclient';
import { useEffect, useRef } from 'react';
import * as vscode from 'vscode';
import path from 'path-browserify';
import {
  CloseAction,
  ErrorAction,
  MessageTransports,
} from 'vscode-languageclient';
import {
  WebSocketMessageReader,
  WebSocketMessageWriter,
  toSocket,
} from 'vscode-ws-jsonrpc';
import { ExtensionHostKind, registerExtension } from 'vscode/extensions';
import { createConfiguredEditor } from 'vscode/monaco';
import { createUrl } from './client-commons';
let languageClient: MonacoLanguageClient;
declare var URL1;
declare var URL2;
const languageId = 'cpp';
const createWebSocket = (url: string): WebSocket => {
  const webSocket = new WebSocket(url);
  webSocket.onopen = async () => {
    const socket = toSocket(webSocket);
    const reader = new WebSocketMessageReader(socket);
    const writer = new WebSocketMessageWriter(socket);
    reader.onPartialMessage((e) => {
      console.log(e);
    });
    languageClient = createLanguageClient({
      reader,
      writer,
    });
    await languageClient.start();
    reader.onClose(() => languageClient.stop());
  };

  return webSocket;
};
const createLanguageClient = (
  transports: MessageTransports,
): MonacoLanguageClient => {
  return new MonacoLanguageClient({
    name: 'c client',
    clientOptions: {
      // use a language id as a document selector
      documentSelector: [languageId],
      // disable the default error handler
      errorHandler: {
        error: () => ({ action: ErrorAction.Continue }),
        closed: () => ({ action: CloseAction.DoNotRestart }),
      },

      synchronize: {
        fileEvents: [vscode.workspace.createFileSystemWatcher('**')],
      },
    },
    // create a language client connection from the JSON RPC connection on demand
    connectionProvider: {
      get: () => {
        return Promise.resolve(transports);
      },
    },
  });
};

const Editor = () => {
  const editorContainer = useRef<HTMLDivElement>(null);
  const editorRef = useRef<editor.IStandaloneCodeEditor>(null);

  async function init() {
    await initServices({
      userServices: {
        ...getConfigurationServiceOverride(),
      },
      debugLogging: true,
    });

    const extension = {
      name: 'c-client',
      publisher: 'monaco-languageclient-project',
      version: '1.0.0',
      engines: {
        vscode: '^1.78.0',
      },
      contributes: {
        languages: [
          {
            id: languageId,
            aliases: ['C'],
            extensions: ['.c', '.h'],
          },
        ],
      },
    };
    registerExtension(extension, ExtensionHostKind.LocalProcess);

    editorRef.current = createConfiguredEditor(editorContainer.current, {
      folding: true,
      language: 'c',
      theme: 'vs',
      readOnly: true,
      overviewRulerBorder: false, // 不要滚动条的边框
      scrollbar: {
        // 滚动条设置
        verticalScrollbarSize: 6, // 竖滚动条
        horizontalScrollbarSize: 10, // 横滚动条
      },
      minimap: {
        enabled: false, // 是否启用预览图
      }, // 预览图设置
      automaticLayout: true,
      model: monaco.editor.createModel(
        `
#include <stdio.h>
#include "hello.h"
int main() {
  return 0;
}
int a() {
  return 0;
}
`,
        'cpp',
        monaco.Uri.file(URL1),
      ),
    });
    monaco.editor.createModel(
      `

int a() {
}
`,
      languageId,
      monaco.Uri.file(URL2),
    );
    (editorRef.current as any)._codeEditorService.openCodeEditor = (input: {
      resource: monaco.Uri;
      options: any;
    }) => {
      const { resource, options } = input;
      console.log(resource);

      const range = options.selection;
      // editorRef.current.getModel().setValue()
    };
    const webSocket = createWebSocket(
      createUrl(
        'localhost',
        30002,
        '/clangd',
        {
          // Used to parse an auth token or additional parameters such as import IDs to the language server
          authorization: 'UserAuth',
          // By commenting above line out and commenting below line in, connection to language server will be denied.
          // authorization: 'FailedUserAuth'
        },
        false,
      ),
    );

    // vscode.languages.registerDefinitionProvider(languageId, {
    //   provideDefinition(model, position, token) {
    //     // console.log(model)
    //     return new Promise((resolve, reject)=>{
    //       webSocket.addEventListener('message',(e)=>{
    //         console.log(e.data);
    //         resolve(null)
    //       })
    //     })

    //   },
    // })
  }
  useEffect(() => {
    init();
  }, []);

  return (
    <>
      <div
        style={{
          height: '100%',
          width: '100%',
        }}
        ref={editorContainer}
      ></div>
    </>
  );
};

export default Editor;
