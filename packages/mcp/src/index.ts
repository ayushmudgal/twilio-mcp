#!/usr/bin/env node
import { logger } from '@ayushmudgal94/openapi-mcp-server';

import main from '@app/main';

main().catch((error) => {
  logger.error(`Fatal error in main(): ${error}`);
  process.exit(1);
});
