import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { logger } from '@ayushmudgal94/openapi-mcp-server';

import TwilioOpenAPIMCPServer from '@app/server';
import { args, type AccountCredentials } from '@app/utils';

export default async function main() {
  let credentials: AccountCredentials | null;
  const { services, accountSid, apiKey, apiSecret, tags, methods } = await args(
    process.argv,
  );

  if (accountSid && apiKey && apiSecret) {
    credentials = { accountSid, apiKey, apiSecret };
  } else {
    logger.error('Error: Please provide credentials.');
    process.exit(1);
  }

  const server = new TwilioOpenAPIMCPServer({
    server: {
      name: 'twilio-server',
      version: '0.0.1',
    },
    filters: {
      services,
      tags,
      methods,
    },
    accountSid: credentials.accountSid,
    credentials: {
      apiKey: credentials.apiKey,
      apiSecret: credentials.apiSecret,
    },
  });

  const transport = new StdioServerTransport();
  await server.start(transport);
  logger.info('Twilio MCP Server running on stdio');
}
