import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({ cors: { origin: process.env.FRONTEND_URL || '*' } })
export class EventsGateway {
  @WebSocketServer() server: Server;

  // Customers join a room for their specific order to get payment updates.
  @SubscribeMessage('joinOrder')
  joinOrder(@MessageBody() orderId: string, client: Socket) {
    // socket.io passes client as 2nd arg via @ConnectedSocket, simplified here
  }

  // Emitters used by services -----------------------------------------------

  // Notify kitchen dashboard that a NEW paid order arrived (triggers sound).
  emitNewKitchenOrder(order: any) {
    this.server.emit('kitchen:newOrder', order);
  }

  // Notify kitchen dashboard a status changed.
  emitKitchenUpdate(order: any) {
    this.server.emit('kitchen:update', order);
  }

  // Notify a specific customer about their payment / order status.
  emitOrderStatus(orderId: string, payload: any) {
    this.server.emit(`order:${orderId}`, payload);
  }
}
