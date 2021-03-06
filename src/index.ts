import {Client} from 'discord.js';
import {handle as debug} from './events/debug';
import {handle as error} from './events/error';
import {handle as presenceUpdate} from './events/presence-update';
import {handle as ready} from './events/ready';
import {handle as warn} from './events/warn';
import {MessagePublisher, messagePublisherLogger} from './rabbitmq/message-publisher';
import {clientOptions} from './util/client-options';
import {amqpUri, discordToken, queue} from './util/config';
import {logger} from './util/logger';
import {PresenceUtil} from './util/presence';

if (amqpUri === undefined) {
	throw new TypeError('No AMQP URI was defined');
}

/** Discord.js client. */
export const client = new Client(clientOptions);

messagePublisherLogger.info('Initializing message publisher');

const messagePublisher = new MessagePublisher(queue, amqpUri);

messagePublisher
	.init()
	.then(() => messagePublisherLogger.info('Message publisher initialized'))
	.catch(error => messagePublisherLogger.error(error));

const presenceUtil = new PresenceUtil(client, messagePublisher);

client
	.on('debug', debug)
	.on('error', error)
	.on('presenceUpdate', async (...args) => presenceUpdate(presenceUtil, ...args))
	.on('ready', async () => ready(presenceUtil))
	.on('warn', warn);

client.login(discordToken).catch(error => logger.fatal(error));
