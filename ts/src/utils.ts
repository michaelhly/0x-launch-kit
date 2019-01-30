import { Schema, SchemaValidator } from '@0x/json-schemas';
import { ValidationError as SchemaValidationError } from 'jsonschema';
import * as _ from 'lodash';

import { ValidationError, ValidationErrorCodes, ValidationErrorItem } from './errors';
import { SignedOrderModel } from './models/SignedOrderModel';

const schemaValidator = new SchemaValidator();

export const utils = {
    log: (...args: any[]) => {
        // tslint:disable-next-line:no-console
        console.log(...args);
    },
    validateSchema(instance: any, schema: Schema): void {
        const validationResult = schemaValidator.validate(instance, schema);
        if (_.isEmpty(validationResult.errors)) {
            return;
        } else {
            const validationErrorItems = _.map(
                validationResult.errors,
                (schemaValidationError: SchemaValidationError) =>
                    schemaValidationErrorToValidationErrorItem(schemaValidationError),
            );
            throw new ValidationError(validationErrorItems);
        }
    },
};

function schemaValidationErrorToValidationErrorItem(schemaValidationError: SchemaValidationError): ValidationErrorItem {
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
            code: ValidationErrorCodes.IncorrectFormat,
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
            code: ValidationErrorCodes.ValueOutOfRange,
            reason: schemaValidationError.message,
        };
    } else if (schemaValidationError.name === 'required') {
        return {
            field: schemaValidationError.argument,
            code: ValidationErrorCodes.RequiredField,
            reason: schemaValidationError.message,
        };
    } else if (schemaValidationError.name === 'not') {
        return {
            field: schemaValidationError.property,
            code: ValidationErrorCodes.UnsupportedOption,
            reason: schemaValidationError.message,
        };
    } else {
        throw new Error(`Unknnown schema validation error name: ${schemaValidationError.name}`);
    }
}

const mergeSort = (left: any, right: any): any => {
    const merged: any[] = [];
    var l: number = 0;
    var r: number = 0;

    while (l < left.length && r < right.length) {
        let leftOrder: any = left[l];
        let leftPrice: number = parseInt(leftOrder.takerAssetAmount) / parseInt(leftOrder.makerAssetAmount);
        let rightOrder: any = right[r];
        let rightPrice: number = parseInt(rightOrder.takerAssetAmount) / parseInt(rightOrder.makerAssetAmount);

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

export const mergeSortOrders = (
    signedOrderModels: Array<Required<SignedOrderModel>>,
): Array<Required<SignedOrderModel>> => {
    const totalOrders = signedOrderModels.length;
    if (totalOrders < 2) return signedOrderModels;
    var center = totalOrders >>> 1;
    var left = signedOrderModels.slice(0, center);
    var right = signedOrderModels.slice(center, totalOrders);

    return mergeSort(left, right) as Array<Required<SignedOrderModel>>;
};
