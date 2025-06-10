// utils/query.utils.ts
import { ParsedQs } from 'qs';

type QueryParamValue = string | ParsedQs | (string | ParsedQs)[] | undefined;

/**
 * Safely extracts a string value from a query parameter,
 * handling arrays and objects.
 * 
 * @param param The query parameter value
 * @returns A string value or null if the parameter is invalid
 */
export const extractStringParam = (param: QueryParamValue): string | null => {
    if (!param) {
        return null;
    }

    if (Array.isArray(param)) {
        if (param.length === 0) {
            return null;
        }
        const firstItem = param[0];
        return typeof firstItem === 'string' ? firstItem : String(firstItem);
    }

    return typeof param === 'string' ? param : String(param);
};

/**
 * Safely extracts a date value from a query parameter.
 * 
 * @param param The query parameter value
 * @returns A Date object or null if the parameter is invalid
 */
export const extractDateParam = (param: QueryParamValue): Date | null => {
    const strParam = extractStringParam(param);

    if (!strParam) {
        return null;
    }

    try {
        const date = new Date(strParam);
        // Check if date is valid
        return isNaN(date.getTime()) ? null : date;
    } catch (error) {
        return null;
    }
};

/**
 * Safely extracts a UUID value from a query parameter,
 * with optional validation.
 * 
 * @param param The query parameter value
 * @param validate Whether to validate the UUID format
 * @returns A string value or null if the parameter is invalid
 */
export const extractUuidParam = (
    param: QueryParamValue,
    validate = true
): string | null => {
    const strParam = extractStringParam(param);

    if (!strParam) {
        return null;
    }

    if (validate) {
        // Basic UUID validation (supports both v1 and v4)
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        return uuidRegex.test(strParam) ? strParam : null;
    }

    return strParam;
};