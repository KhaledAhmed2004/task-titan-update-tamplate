"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const date_fns_1 = require("date-fns");
class QueryBuilder {
    constructor(modelQuery, query) {
        this.modelQuery = modelQuery;
        this.query = query;
    }
    // 🔍 Searching across multiple fields
    search(searchableFields) {
        var _a;
        if ((_a = this === null || this === void 0 ? void 0 : this.query) === null || _a === void 0 ? void 0 : _a.searchTerm) {
            this.modelQuery = this.modelQuery.find({
                $or: searchableFields.map(field => ({
                    [field]: {
                        $regex: this.query.searchTerm,
                        $options: 'i',
                    },
                })),
            });
        }
        return this;
    }
    // 🔎 Filtering
    filter() {
        var _a;
        const queryObj = Object.assign({}, this.query);
        const excludeFields = [
            'searchTerm',
            'sort',
            'page',
            'limit',
            'fields',
            'timeFilter',
            'start',
            'end',
            'category', // we will handle this separately
            'latitude', // we will handle this separately
            'longitude', // we will handle this separately
            'distance', // we will handle this separately
        ];
        excludeFields.forEach(el => delete queryObj[el]);
        this.modelQuery = this.modelQuery.find(queryObj);
        // ✅ Category filtering (support single or multiple)
        if ((_a = this === null || this === void 0 ? void 0 : this.query) === null || _a === void 0 ? void 0 : _a.category) {
            const categories = this.query.category
                .split(',')
                .map(cat => cat.trim());
            // Apply category filter
            this.modelQuery = this.modelQuery.find(Object.assign(Object.assign({}, this.modelQuery.getFilter()), { taskCategory: { $in: categories } }));
        }
        return this;
    }
    // 📍 Location-based filtering using MongoDB geospatial query
    locationFilter() {
        var _a, _b, _c;
        if (((_a = this === null || this === void 0 ? void 0 : this.query) === null || _a === void 0 ? void 0 : _a.latitude) && ((_b = this === null || this === void 0 ? void 0 : this.query) === null || _b === void 0 ? void 0 : _b.longitude) && ((_c = this === null || this === void 0 ? void 0 : this.query) === null || _c === void 0 ? void 0 : _c.distance)) {
            const lat = parseFloat(this.query.latitude);
            const lng = parseFloat(this.query.longitude);
            const distance = parseFloat(this.query.distance);
            // Validate coordinates
            if (isNaN(lat) || isNaN(lng) || isNaN(distance)) {
                throw new Error('Invalid latitude, longitude, or distance values');
            }
            if (lat < -90 || lat > 90) {
                throw new Error('Latitude must be between -90 and 90 degrees');
            }
            if (lng < -180 || lng > 180) {
                throw new Error('Longitude must be between -180 and 180 degrees');
            }
            if (distance <= 0) {
                throw new Error('Distance must be greater than 0');
            }
            // Use MongoDB's $geoWithin with $centerSphere for distance-based filtering
            // Convert distance from kilometers to radians (divide by Earth's radius in km)
            const distanceInRadians = distance / 6371;
            this.modelQuery = this.modelQuery.find({
                $and: [
                    { latitude: { $exists: true, $ne: null } },
                    { longitude: { $exists: true, $ne: null } },
                    {
                        $expr: {
                            $lte: [
                                {
                                    $multiply: [
                                        6371, // Earth's radius in kilometers
                                        {
                                            $acos: {
                                                $add: [
                                                    {
                                                        $multiply: [
                                                            { $sin: { $multiply: [{ $degreesToRadians: lat }, 1] } },
                                                            { $sin: { $multiply: [{ $degreesToRadians: '$latitude' }, 1] } }
                                                        ]
                                                    },
                                                    {
                                                        $multiply: [
                                                            { $cos: { $multiply: [{ $degreesToRadians: lat }, 1] } },
                                                            { $cos: { $multiply: [{ $degreesToRadians: '$latitude' }, 1] } },
                                                            { $cos: { $multiply: [{ $degreesToRadians: { $subtract: [lng, '$longitude'] } }, 1] } }
                                                        ]
                                                    }
                                                ]
                                            }
                                        }
                                    ]
                                },
                                distance
                            ]
                        }
                    }
                ]
            });
        }
        return this;
    }
    // ⏰ Date filtering (recently, weekly, monthly, custom)
    dateFilter() {
        var _a;
        if ((_a = this === null || this === void 0 ? void 0 : this.query) === null || _a === void 0 ? void 0 : _a.timeFilter) {
            const now = new Date();
            let dateRange = {};
            if (this.query.timeFilter === 'recently') {
                // Last 24 hours
                const yesterday = new Date(now);
                yesterday.setDate(now.getDate() - 1);
                dateRange = { $gte: yesterday, $lte: now };
            }
            else if (this.query.timeFilter === 'weekly') {
                // Current week (Mon–Sun)
                dateRange = {
                    $gte: (0, date_fns_1.startOfWeek)(now, { weekStartsOn: 1 }),
                    $lte: (0, date_fns_1.endOfWeek)(now, { weekStartsOn: 1 }),
                };
            }
            else if (this.query.timeFilter === 'monthly') {
                // Current month
                dateRange = {
                    $gte: (0, date_fns_1.startOfMonth)(now),
                    $lte: (0, date_fns_1.endOfMonth)(now),
                };
            }
            else if (this.query.timeFilter === 'custom') {
                // Custom range: requires ?start=YYYY-MM-DD&end=YYYY-MM-DD
                if (!this.query.start || !this.query.end) {
                    throw new Error("Custom date filter requires both 'start' and 'end' query parameters.");
                }
                const startDate = new Date(this.query.start);
                const endDate = new Date(this.query.end);
                if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
                    throw new Error("Invalid date format. Use 'YYYY-MM-DD' format for 'start' and 'end'.");
                }
                if (startDate > endDate) {
                    throw new Error("'start' date cannot be after 'end' date.");
                }
                dateRange = { $gte: startDate, $lte: endDate };
            }
            if (Object.keys(dateRange).length > 0) {
                this.modelQuery = this.modelQuery.find(Object.assign(Object.assign({}, this.modelQuery.getFilter()), { createdAt: dateRange }));
            }
        }
        return this;
    }
    // ↕️ Sorting
    sort() {
        var _a;
        let sort = ((_a = this === null || this === void 0 ? void 0 : this.query) === null || _a === void 0 ? void 0 : _a.sort) || '-createdAt';
        this.modelQuery = this.modelQuery.sort(sort);
        return this;
    }
    // 📄 Pagination
    paginate() {
        var _a, _b;
        let limit = Number((_a = this === null || this === void 0 ? void 0 : this.query) === null || _a === void 0 ? void 0 : _a.limit) || 10;
        let page = Number((_b = this === null || this === void 0 ? void 0 : this.query) === null || _b === void 0 ? void 0 : _b.page) || 1;
        let skip = (page - 1) * limit;
        this.modelQuery = this.modelQuery.skip(skip).limit(limit);
        return this;
    }
    // 🎯 Field selection
    fields() {
        var _a, _b;
        let fields = ((_b = (_a = this === null || this === void 0 ? void 0 : this.query) === null || _a === void 0 ? void 0 : _a.fields) === null || _b === void 0 ? void 0 : _b.split(',').join(' ')) || '-__v';
        this.modelQuery = this.modelQuery.select(fields);
        return this;
    }
    // 🔗 Populating relations and select all fields if undefined
    populate(populateFields, selectFields) {
        this.modelQuery = this.modelQuery.populate(populateFields.map(field => {
            var _a;
            return ({
                path: field,
                select: (_a = selectFields === null || selectFields === void 0 ? void 0 : selectFields[field]) !== null && _a !== void 0 ? _a : undefined,
            });
        }));
        return this;
    }
    // 🎯 Populate with match conditions for filtering
    populateWithMatch(path, matchConditions = {}, selectFields) {
        this.modelQuery = this.modelQuery.populate({
            path,
            match: matchConditions,
            select: selectFields !== null && selectFields !== void 0 ? selectFields : '-__v',
        });
        return this;
    }
    // 🔍 Search within populated fields
    searchInPopulatedFields(path, searchableFields, searchTerm, additionalMatch = {}) {
        if (searchTerm) {
            const searchConditions = {
                $and: [
                    {
                        $or: searchableFields.map(field => ({
                            [field]: {
                                $regex: searchTerm,
                                $options: 'i',
                            },
                        })),
                    },
                    additionalMatch,
                ],
            };
            this.modelQuery = this.modelQuery.populate({
                path,
                match: searchConditions,
                select: '-__v',
            });
        }
        return this;
    }
    // 🧹 Filter out documents with null populated fields
    filterNullPopulatedFields() {
        return this;
    }
    // 📊 Get filtered results with custom pagination
    getFilteredResults() {
        return __awaiter(this, arguments, void 0, function* (populatedFieldsToCheck = []) {
            var _a, _b;
            const results = yield this.modelQuery;
            // Filter out documents where specified populated fields are null
            const filteredResults = results.filter((doc) => {
                if (populatedFieldsToCheck.length === 0) {
                    return true; // No filtering if no fields specified
                }
                return populatedFieldsToCheck.every((fieldPath) => {
                    const value = doc.get ? doc.get(fieldPath) : doc[fieldPath];
                    return value !== null && value !== undefined;
                });
            });
            // Calculate pagination based on filtered results
            const total = filteredResults.length;
            const limit = Number((_a = this === null || this === void 0 ? void 0 : this.query) === null || _a === void 0 ? void 0 : _a.limit) || 10;
            const page = Number((_b = this === null || this === void 0 ? void 0 : this.query) === null || _b === void 0 ? void 0 : _b.page) || 1;
            const totalPage = Math.ceil(total / limit);
            const pagination = {
                total,
                limit,
                page,
                totalPage,
            };
            return {
                data: filteredResults,
                pagination,
            };
        });
    }
    // 📊 Pagination info
    getPaginationInfo() {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            const total = yield this.modelQuery.model.countDocuments(this.modelQuery.getFilter());
            const limit = Number((_a = this === null || this === void 0 ? void 0 : this.query) === null || _a === void 0 ? void 0 : _a.limit) || 10;
            const page = Number((_b = this === null || this === void 0 ? void 0 : this.query) === null || _b === void 0 ? void 0 : _b.page) || 1;
            const totalPage = Math.ceil(total / limit);
            return {
                total,
                limit,
                page,
                totalPage,
            };
        });
    }
}
exports.default = QueryBuilder;
