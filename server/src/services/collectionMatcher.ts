import { type FilterQuery } from "mongoose";
import { type IProduct } from "../models/Product.js";
import { type MatchRule, type Condition } from "../schemas/collection.schema.js";

export function conditionToMongoFilter(condition: Condition): FilterQuery<IProduct> {
  const { field, op, value } = condition;

  switch (op) {
    case "eq":
      return { [field]: value };
    case "in":
      return { [field]: { $in: Array.isArray(value) ? value : [value] } };
    case "lt":
      return { [field]: { $lt: value } };
    case "containsAny":
      return { [field]: { $in: Array.isArray(value) ? value : [value] } };
    case "isTrue":
      return { [field]: true };
    default:
      return {};
  }
}

export function buildMongoFilter(rule?: MatchRule): FilterQuery<IProduct> {
  if (!rule) {
    return {};
  }

  if (rule.matchAll) {
    return {};
  }

  if (!rule.any || rule.any.length === 0) {
    return { _id: null };
  }

  const filters = rule.any.map(conditionToMongoFilter);

  if (filters.length === 1) {
    return filters[0] as FilterQuery<IProduct>;
  }

  return { $or: filters };
}
