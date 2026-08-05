import { z } from "zod";

export const propertyReportFilterSchema = z.union([z.literal(""), z.uuid()]).optional();
