import { Product } from "../models/Product.js";
import { Collection } from "../models/Collection.js";
import { buildMongoFilter } from "./collectionMatcher.js";
export const PRICE_BUCKETS = {
    u500: { price: { $lt: 500 } },
    "500-999": { price: { $gte: 500, $lt: 1000 } },
    "1000-1499": { price: { $gte: 1000, $lt: 1500 } },
    "1500+": { price: { $gte: 1500 } },
};
function ensureArray(val) {
    if (!val)
        return [];
    if (Array.isArray(val))
        return val.filter(Boolean);
    return [val].filter(Boolean);
}
export async function queryProducts(params) {
    const page = Math.max(1, Number(params.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(params.limit) || 24));
    const skip = (page - 1) * limit;
    const andConditions = [];
    // 1. Collection filter
    if (params.collection) {
        const col = await Collection.findOne({ slug: params.collection });
        if (!col) {
            return { items: [], total: 0, page, limit };
        }
        const colFilter = buildMongoFilter(col.match);
        if (Object.keys(colFilter).length > 0) {
            andConditions.push(colFilter);
        }
    }
    // 2. Category filter
    const categories = ensureArray(params.category);
    if (categories.length > 0) {
        andConditions.push({ category: { $in: categories } });
    }
    // 3. Retailer filter
    const retailers = ensureArray(params.retailer);
    if (retailers.length > 0) {
        andConditions.push({ retailer: { $in: retailers } });
    }
    // 4. Size filter
    const sizes = ensureArray(params.size);
    if (sizes.length > 0) {
        andConditions.push({ availableSizes: { $in: sizes } });
    }
    // 5. Color filter
    const colors = ensureArray(params.color);
    if (colors.length > 0) {
        andConditions.push({ availableColors: { $in: colors } });
    }
    // 6. InStock filter
    if (params.inStock === true || params.inStock === "true") {
        andConditions.push({ inStock: true });
    }
    // 7. Price buckets
    const priceBuckets = ensureArray(params.price);
    if (priceBuckets.length > 0) {
        const priceConditions = priceBuckets
            .map((b) => PRICE_BUCKETS[b])
            .filter(Boolean);
        if (priceConditions.length > 0) {
            andConditions.push({ $or: priceConditions });
        }
    }
    // 8. Text search parameter if provided directly
    if (params.q && params.q.trim()) {
        const term = params.q.trim();
        andConditions.push({
            $or: [
                { name: { $regex: term, $options: "i" } },
                { brand: { $regex: term, $options: "i" } },
                { retailer: { $regex: term, $options: "i" } },
                { tags: { $in: [new RegExp(term, "i")] } },
            ],
        });
    }
    const filter = andConditions.length > 0 ? { $and: andConditions } : {};
    // Sort logic
    const sort = params.sort || "recommended";
    if (sort === "recommended") {
        // Pipeline for recommended score: (isEditorsPick ? 2 : 0) + (isFeatured ? 1 : 0)
        const pipeline = [
            ...(Object.keys(filter).length > 0 ? [{ $match: filter }] : []),
            {
                $addFields: {
                    score: {
                        $add: [
                            { $cond: [{ $eq: ["$isEditorsPick", true] }, 2, 0] },
                            { $cond: [{ $eq: ["$isFeatured", true] }, 1, 0] },
                        ],
                    },
                },
            },
            {
                $facet: {
                    items: [{ $sort: { score: -1, _id: -1 } }, { $skip: skip }, { $limit: limit }],
                    totalCount: [{ $count: "count" }],
                },
            },
        ];
        const [result] = await Product.aggregate(pipeline);
        const total = result.totalCount[0]?.count || 0;
        const items = result.items.map((doc) => {
            doc.id = String(doc._id);
            delete doc._id;
            delete doc.__v;
            delete doc.score;
            return doc;
        });
        return { items, total, page, limit };
    }
    let mongoSort = {};
    if (sort === "newest") {
        mongoSort = { lastUpdatedAt: -1 };
    }
    else if (sort === "price-asc") {
        mongoSort = { price: 1 };
    }
    else if (sort === "price-desc") {
        mongoSort = { price: -1 };
    }
    const [items, total] = await Promise.all([
        Product.find(filter).sort(mongoSort).skip(skip).limit(limit),
        Product.countDocuments(filter),
    ]);
    return {
        items: items.map((doc) => doc.toJSON()),
        total,
        page,
        limit,
    };
}
export async function getFilterOptions(collectionSlug) {
    let filter = {};
    if (collectionSlug) {
        const col = await Collection.findOne({ slug: collectionSlug });
        if (col) {
            filter = buildMongoFilter(col.match);
        }
    }
    const products = await Product.find(filter);
    return {
        category: Array.from(new Set(products.map((p) => p.category))),
        retailer: Array.from(new Set(products.map((p) => p.retailer))).sort(),
        size: Array.from(new Set(products.flatMap((p) => p.availableSizes))),
        color: Array.from(new Set(products.flatMap((p) => p.availableColors))).sort(),
    };
}
export async function getProductRails(product) {
    const allProducts = await Product.find();
    const similar = allProducts
        .filter((x) => x.slug !== product.slug && x.category === product.category)
        .slice(0, 4)
        .map((p) => p.toJSON());
    const similarSlugs = new Set(similar.map((s) => s.slug));
    const collection = allProducts
        .filter((x) => x.slug !== product.slug &&
        !similarSlugs.has(x.slug) &&
        x.collectionIds.some((c) => product.collectionIds.includes(c)))
        .slice(0, 4)
        .map((p) => p.toJSON());
    const budget = allProducts
        .filter((x) => x.slug !== product.slug && Math.abs(x.price - product.price) <= 400)
        .slice(0, 4)
        .map((p) => p.toJSON());
    return { similar, collection, budget };
}
