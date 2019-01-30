'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
const json_schemas_1 = require('@0x/json-schemas');
const _ = require('lodash');
const errors_1 = require('./errors');
const schemaValidator = new json_schemas_1.SchemaValidator();
exports.utils = {
    log: (...args) => {
        // tslint:disable-next-line:no-console
        console.log(...args);
    },
    validateSchema(instance, schema) {
        const validationResult = schemaValidator.validate(instance, schema);
        if (_.isEmpty(validationResult.errors)) {
            return;
        } else {
            const validationErrorItems = _.map(validationResult.errors, schemaValidationError =>
                schemaValidationErrorToValidationErrorItem(schemaValidationError),
            );
            throw new errors_1.ValidationError(validationErrorItems);
        }
    },
    mergeSortOrders(signedOrderModels) {
        const totalOrders = signedOrderModels.length;
        if (totalOrders < 2) return signedOrderModels;
        var center = totalOrders >>> 1;
        var left = signedOrderModels.slice(0, center);
        var right = signedOrderModels.slice(center, totalOrders);

        return mergeSort(left, right);
    },
};
function schemaValidationErrorToValidationErrorItem(schemaValidationError) {
    if (
        _.includes(
            [
                'type',
                'anyOf',
                'allOf',
                'oneOf',
                'additionalProperties',
                'minProperties',
                'maxProperties',
                'pattern',
                'format',
                'uniqueItems',
                'items',
                'dependencies',
            ],
            schemaValidationError.name,
        )
    ) {
        return {
            field: schemaValidationError.property,
            code: errors_1.ValidationErrorCodes.IncorrectFormat,
            reason: schemaValidationError.message,
        };
    } else if (
        _.includes(
            ['minimum', 'maximum', 'minLength', 'maxLength', 'minItems', 'maxItems', 'enum', 'const'],
            schemaValidationError.name,
        )
    ) {
        return {
            field: schemaValidationError.property,
            code: errors_1.ValidationErrorCodes.ValueOutOfRange,
            reason: schemaValidationError.message,
        };
    } else if (schemaValidationError.name === 'required') {
        return {
            field: schemaValidationError.argument,
            code: errors_1.ValidationErrorCodes.RequiredField,
            reason: schemaValidationError.message,
        };
    } else if (schemaValidationError.name === 'not') {
        return {
            field: schemaValidationError.property,
            code: errors_1.ValidationErrorCodes.UnsupportedOption,
            reason: schemaValidationError.message,
        };
    } else {
        throw new Error(`Unknnown schema validation error name: ${schemaValidationError.name}`);
    }
}

const mergeSort = (left, right) => {
    const merged = [];
    var l = 0;
    var r = 0;

    while (l < left.length && r < right.length) {
        let leftOrder = left[l];
        let leftPrice = parseInt(leftOrder.takerAssetAmount) / parseInt(leftOrder.makerAssetAmount);
        let rightOrder = right[r];
        let rightPrice = parseInt(rightOrder.takerAssetAmount) / parseInt(rightOrder.makerAssetAmount);

        if (leftPrice > rightPrice) {
            merged.push(leftOrder);
            l++;
        } else {
            merged.push(rightOrder);
            r++;
        }
    }
    while (l < left.length) {
        merged.push(left[l]);
        l++;
    }

    while (r < right.length) {
        merged.push(right[r]);
        r++;
    }

    return merged;
};
