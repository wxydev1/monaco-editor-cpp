import getConfigurationServiceOverride from '@codingame/monaco-vscode-configuration-service-override';
import * as monaco from 'monaco-editor';
import { editor } from 'monaco-editor';
import 'monaco-editor/esm/vs/basic-languages/cpp/cpp.contribution';
import { MonacoLanguageClient, initServices } from 'monaco-languageclient';
import { useEffect, useRef } from 'react';
import * as vscode from 'vscode';
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
const languageId = 'm';
declare var URL3: string;
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

const MEditor = () => {
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
            aliases: ['matlab'],
            extensions: ['.m'],
          },
        ],
      },
    };
    registerExtension(extension, ExtensionHostKind.LocalProcess);

    editorRef.current = createConfiguredEditor(editorContainer.current, {
      folding: true,
      language: 'c',
      theme: 'vs',
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
function output = name(input)

en
`,
        languageId,
        monaco.Uri.file(URL3),
      ),
    });

    const webSocket = createWebSocket(
      createUrl(
        'localhost',
        30003,
        '/matlab',
        {
          // Used to parse an auth token or additional parameters such as import IDs to the language server
          authorization: 'UserAuth',
          // By commenting above line out and commenting below line in, connection to language server will be denied.
          // authorization: 'FailedUserAuth'
        },
        false,
      ),
    );
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

export { MEditor };
