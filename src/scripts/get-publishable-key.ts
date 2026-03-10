import { ExecArgs } from "@medusajs/framework/types";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";

export default async function getPublishableKeys({ container }: ExecArgs) {
  const query = container.resolve(ContainerRegistrationKeys.QUERY);
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);

  const { data: apiKeys } = await query.graph({
    entity: "api_key",
    fields: ["id", "title", "token", "type"],
    filters: {
      type: "publishable",
    },
  });

  if (apiKeys.length === 0) {
    logger.info("No publishable API keys found.");
  } else {
    logger.info("Publishable API Keys:");
    apiKeys.forEach((key: any) => {
      logger.info(`Title: ${key.title}, Token: ${key.token}, ID: ${key.id}`);
    });
  }
}
