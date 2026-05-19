import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
interface SocketData {
    userId: string;
    email: string;
}
export declare function getSocketIO(): SocketIOServer | null;
export declare function getConnectionManager(): Map<string, Socket>;
export declare function setupSocketIO(server: HTTPServer): SocketIOServer<import("socket.io").DefaultEventsMap, import("socket.io").DefaultEventsMap, import("socket.io").DefaultEventsMap, any>;
export type { SocketData };
//# sourceMappingURL=socket.d.ts.map