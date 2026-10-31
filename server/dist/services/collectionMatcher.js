export function conditionToMongoFilter(condition) {
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
export function buildMongoFilter(rule) {
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
        return filters[0];
    }
    return { $or: filters };
}
