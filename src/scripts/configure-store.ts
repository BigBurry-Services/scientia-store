import { ExecArgs } from "@medusajs/framework/types";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";
import {
    createRegionsWorkflow,
    createTaxRegionsWorkflow,
    createProductCategoriesWorkflow
} from "@medusajs/medusa/core-flows";

export default async function configureStore({ container }: ExecArgs) {
    const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
    const regionModuleService = container.resolve(Modules.REGION);

    logger.info("Adding India region...");

    const existingRegions = await regionModuleService.listRegions({ name: "India" });

    if (existingRegions.length === 0) {
        const { result: regionResult } = await createRegionsWorkflow(container).run({
            input: {
                regions: [
                    {
                        name: "India",
                        currency_code: "inr",
                        countries: ["in"],
                        payment_providers: [
                            "pp_system_default",
                            "pp_razorpay_razorpay",
                        ],
                    },
                ],
            },
        });

        const region = regionResult[0];

        await createTaxRegionsWorkflow(container).run({
            input: [{
                country_code: "in",
                provider_id: "tp_system",
            }],
        });

        logger.info("India region added successfully.");
    } else {
        logger.info("India region already exists.");
    }

    logger.info("Creating Scientia catalog categories...");

    const categories = [
        { name: "Books", is_active: true },
        { name: "Physical Books", is_active: true },
        { name: "Question Banks", is_active: true },
        { name: "Notes", is_active: true },
        { name: "Digital Downloads", is_active: true },
    ];

    for (const category of categories) {
        try {
            await createProductCategoriesWorkflow(container).run({
                input: {
                    product_categories: [category],
                },
            });
            logger.info(`Category created: ${category.name}`);
        } catch (error) {
            const message = (error as { message?: string })?.message || String(error);
            if (message.includes("already exists")) {
                logger.info(`Category already exists: ${category.name}`);
                continue;
            }
            throw error;
        }
    }

    logger.info("Scientia catalog categories are configured.");
}
