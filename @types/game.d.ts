import * as io from 'socket.io';
import { SocketPayload } from 'src/module.ts';

interface ClientToServerEvents {
    'module.#{MODULE.ID}#': (payload: SocketPayload) => void;
}

declare global {
    interface Game<
        TActor extends Actor<null>,
        TActors extends Actors<TActor>,
        TChatMessage extends ChatMessage,
        TCombat extends Combat,
        TItem extends Item<null>,
        TMacro extends Macro,
        TScene extends Scene,
        TUser extends User
    > {
        /** A reference to the open Socket.io connection */
        socket: io.Socket<ClientToServerEvents>;
    }
}
