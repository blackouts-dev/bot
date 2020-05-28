import {Presence} from 'discord.js';
import {logger} from '../util/logger';
import {queue, amqpUri} from '../util/config';
import {MessagePublisher, messagePublisherLogger} from '../rabbitmq/publish';

let messagePublisher: MessagePublisher | undefined;

if (amqpUri) {
	messagePublisher = new MessagePublisher(queue, amqpUri);
	messagePublisher
		.init()
		.then(() => messagePublisherLogger.info('Message publisher initialized'))
		.catch(error => messagePublisherLogger.error(error));
}

/**
 * Handle a presence update.
 * @param oldPresence Old presence to handle
 * @param newPresence New presence to handle
 */
export function handle(oldPresence: Presence | undefined, newPresence: Presence): void {
	const {user} = newPresence;

	if (user?.bot && user.client.user?.id !== user.id) {
		const offline = newPresence.status === 'offline';

		logger.info({user: newPresence.userID, offline});

		if (messagePublisher) {
			if (messagePublisher.ready) {
				messagePublisher
					.send({
						bot: user,
						online: !offline,
						time: new Date()
					})
					.catch(error => messagePublisherLogger.error(error));
			} else {
				messagePublisherLogger.warn('message publisher not ready');
			}
		}
	}
}
