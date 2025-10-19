import { FilterQuery, Query } from 'mongoose';
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';

class QueryBuilder<T> {
  public modelQuery: Query<T[], T>;
  public query: Record<string, unknown>;

  constructor(modelQuery: Query<T[], T>, query: Record<string, unknown>) {
    this.modelQuery = modelQuery;
    this.query = query;
  }

  // 🔍 Searching across multiple fields
  search(searchableFields: string[]) {
    if (this?.query?.searchTerm) {
      this.modelQuery = this.modelQuery.find({
        $or: searchableFields.map(
          field =>
            ({
              [field]: {
                $regex: this.query.searchTerm,
                $options: 'i',
              },
            } as FilterQuery<T>)
        ),
      });
    }
    return this;
  }

  // 🔎 Text search using MongoDB text indexes (for models with text index)
  textSearch() {
    if (this?.query?.searchTerm) {
      const term = this.query.searchTerm as string;
      this.modelQuery = this.modelQuery.find({ $text: { $search: term } } as FilterQuery<T>);
    }
    return this;
  }

  // 🔎 Filtering
  filter() {
    const queryObj = { ...this.query };
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

    this.modelQuery = this.modelQuery.find(queryObj as FilterQuery<T>);

    // ✅ Category filtering (support single or multiple)
    if (this?.query?.category) {
      const categories = (this.query.category as string)
        .split(',')
        .map(cat => cat.trim());

      // Apply category filter
      this.modelQuery = this.modelQuery.find({
        ...this.modelQuery.getFilter(), // keep previous filters
        taskCategory: { $in: categories },
      } as FilterQuery<T>);
    }

    return this;
  }

  // 📍 Location-based filtering using index-friendly bounding box
  locationFilter() {
    if (this?.query?.latitude && this?.query?.longitude && this?.query?.distance) {
      const lat = parseFloat(this.query.latitude as string);
      const lng = parseFloat(this.query.longitude as string);
      const distanceKm = parseFloat(this.query.distance as string);

      // Validate coordinates
      if (isNaN(lat) || isNaN(lng) || isNaN(distanceKm)) {
        throw new Error('Invalid latitude, longitude, or distance values');
      }

      if (lat < -90 || lat > 90) {
        throw new Error('Latitude must be between -90 and 90 degrees');
      }

      if (lng < -180 || lng > 180) {
        throw new Error('Longitude must be between -180 and 180 degrees');
      }

      if (distanceKm <= 0) {
        throw new Error('Distance must be greater than 0');
      }

      // Bounding box approximation (fast and index-friendly)
      const latDelta = distanceKm / 111.32; // ~ km per degree latitude
      const latRad = (lat * Math.PI) / 180;
      const cosLat = Math.cos(latRad);
      const lngDelta = distanceKm / (111.32 * (cosLat || 1e-6)); // avoid division by zero at poles

      const minLat = lat - latDelta;
      const maxLat = lat + latDelta;
      const minLng = lng - lngDelta;
      const maxLng = lng + lngDelta;

      this.modelQuery = this.modelQuery.find({
        latitude: { $gte: minLat, $lte: maxLat },
        longitude: { $gte: minLng, $lte: maxLng },
      } as FilterQuery<T>);
    }

    return this;
  }

  // ⏰ Date filtering (recently, weekly, monthly, custom)
  dateFilter() {
    if (this?.query?.timeFilter) {
      const now = new Date();
      let dateRange: Record<string, Date> = {};

      if (this.query.timeFilter === 'recently') {
        // Last 24 hours
        const yesterday = new Date(now);
        yesterday.setDate(now.getDate() - 1);
        dateRange = { $gte: yesterday, $lte: now };
      } else if (this.query.timeFilter === 'weekly') {
        // Current week (Mon–Sun)
        dateRange = {
          $gte: startOfWeek(now, { weekStartsOn: 1 }),
          $lte: endOfWeek(now, { weekStartsOn: 1 }),
        };
      } else if (this.query.timeFilter === 'monthly') {
        // Current month
        dateRange = {
          $gte: startOfMonth(now),
          $lte: endOfMonth(now),
        };
      } else if (this.query.timeFilter === 'custom') {
        // Custom range: requires ?start=YYYY-MM-DD&end=YYYY-MM-DD
        if (!this.query.start || !this.query.end) {
          throw new Error(
            "Custom date filter requires both 'start' and 'end' query parameters."
          );
        }

        const startDate = new Date(this.query.start as string);
        const endDate = new Date(this.query.end as string);

        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
          throw new Error(
            "Invalid date format. Use 'YYYY-MM-DD' format for 'start' and 'end'."
          );
        }

        if (startDate > endDate) {
          throw new Error("'start' date cannot be after 'end' date.");
        }

        dateRange = { $gte: startDate, $lte: endDate };
      }

      if (Object.keys(dateRange).length > 0) {
        this.modelQuery = this.modelQuery.find({
          ...this.modelQuery.getFilter(),
          createdAt: dateRange,
        });
      }
    }

    return this;
  }

  // ↕️ Sorting
  sort() {
    let sort = (this?.query?.sort as string) || '-createdAt';
    this.modelQuery = this.modelQuery.sort(sort);
    return this;
  }

  // 📄 Pagination
  paginate() {
    let limit = Number(this?.query?.limit) || 10;
    let page = Number(this?.query?.page) || 1;
    let skip = (page - 1) * limit;

    this.modelQuery = this.modelQuery.skip(skip).limit(limit);
    return this;
  }

  // 🎯 Field selection
  fields() {
    let fields =
      (this?.query?.fields as string)?.split(',').join(' ') || '-__v';
    this.modelQuery = this.modelQuery.select(fields);
    return this;
  }

  // 🔗 Populating relations and select all fields if undefined
  populate(populateFields: string[], selectFields?: Record<string, unknown>) {
    this.modelQuery = this.modelQuery.populate(
      populateFields.map(field => ({
        path: field,
        select: selectFields?.[field] ?? undefined,
      }))
    );
    return this;
  }

  // 🎯 Populate with match conditions for filtering
  populateWithMatch(
    path: string,
    matchConditions: Record<string, unknown> = {},
    selectFields?: string
  ) {
    this.modelQuery = this.modelQuery.populate({
      path,
      match: matchConditions,
      select: selectFields ?? '-__v',
    });
    return this;
  }

  // 🔍 Search within populated fields
  searchInPopulatedFields(
    path: string,
    searchableFields: string[],
    searchTerm: string,
    additionalMatch: Record<string, unknown> = {}
  ) {
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
  async getFilteredResults(populatedFieldsToCheck: string[] = []) {
    const results = await this.modelQuery;

    // Filter out documents where specified populated fields are null
    const filteredResults = results.filter((doc: any) => {
      if (populatedFieldsToCheck.length === 0) {
        return true; // No filtering if no fields specified
      }

      return populatedFieldsToCheck.every((fieldPath: string) => {
        const value = doc.get ? doc.get(fieldPath) : doc[fieldPath];
        return value !== null && value !== undefined;
      });
    });

    // Calculate pagination based on filtered results
    const total = filteredResults.length;
    const limit = Number(this?.query?.limit) || 10;
    const page = Number(this?.query?.page) || 1;
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
  }

  // 📊 Pagination info
  async getPaginationInfo() {
    const total = await this.modelQuery.model.countDocuments(
      this.modelQuery.getFilter()
    );
    const limit = Number(this?.query?.limit) || 10;
    const page = Number(this?.query?.page) || 1;
    const totalPage = Math.ceil(total / limit);

    return {
      total,
      limit,
      page,
      totalPage,
    };
  }
}

export default QueryBuilder;
