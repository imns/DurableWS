import { describe, it } from "vitest";
import { createClient } from "../src/client";

// const STORAGE_KEY = "sprinthq:test:messageQueue";
// let server: Server;
// let clientConfig: WebSocketClientConfig;
// let client: ReturnType<typeof createClient>;

// beforeEach(async () => {
//     server = new Server("ws://localhost:1234");
//     clientConfig = {
//         url: "ws://localhost:1234",
//         accessToken: "testToken",
//         autoConnect: false,
//     };
//     client = createClient(clientConfig);
//     localStorage.clear(); // Clears local storage before each test
// });

// afterEach(() => {
//     Server.clean();
//     jest.clearAllMocks();
// });

// it("should connect and get the status correctly", async () => {
//     const connectPromise = client.connect();
//     await server.connected;
//     expect(client.getStatus()).toBe(WebSocketClientState.CONNECTED);
//     await connectPromise;
// });

// it("should send and receive messages correctly", async () => {
//     const message = { foo: "bar" };
//     const onMessageMock = jest.fn();
//     client.onMessage(onMessageMock);
//     // await server.connected;
//     client.send(message);
//     expect(server).toReceiveMessage(JSON.stringify(message));
//     server.send(JSON.stringify(message));
//     expect(onMessageMock).toBeCalledWith(message);
// }, 10000);

// it("should save messages in localstorage when not connected and send them after connection", async () => {
//     const message = { foo: "bar" };
//     client.send(message);
//     expect(localStorage.__STORE__[STORAGE_KEY]).toBeTruthy();
//     const connectPromise = client.connect();
//     await server.connected;
//     expect(client.getStatus()).toBe(WebSocketClientState.CONNECTED);
//     await connectPromise;
//     await expect(server).toReceiveMessage(JSON.stringify(message));
//     expect(localStorage.__STORE__[STORAGE_KEY]).toBeFalsy();
// });

// it("should reconnect and send queued messages after server closes unexpectedly", async () => {
//     const message = { foo: "bar" };
//     const connectPromise = client.connect();
//     await server.connected;
//     client.send(message);
//     await expect(server).toReceiveMessage(JSON.stringify(message));
//     server.close({ wasClean: false, code: 1006, reason: "Unexpected closure" });
//     expect(client.getStatus()).toBe(WebSocketClientState.CLOSED);
//     server = new Server("ws://localhost:1234");
//     await server.connected;
//     await expect(server).toReceiveMessage(JSON.stringify(message));
//     await connectPromise;
// }, 10000);
