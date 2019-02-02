import { Schema, SchemaValidator } from '@0x/json-schemas';
import { ValidationError as SchemaValidationError } from 'jsonschema';
import * as _ from 'lodash';

import { RADIX_STRING } from './config';
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

export enum OrderbookSide {
    Asks,
    Bids,
}

const calcPrice = (side: OrderbookSide, order: SignedOrderModel): number => {
    return side === OrderbookSide.Asks
        ? parseInt(order.takerAssetAmount as string, RADIX_STRING) /
              parseInt(order.makerAssetAmount as string, RADIX_STRING)
        : parseInt(order.makerAssetAmount as string, RADIX_STRING) /
              parseInt(order.takerAssetAmount as string, RADIX_STRING);
};

const merge = (side: OrderbookSide, left: SignedOrderModel[], right: SignedOrderModel[]): SignedOrderModel[] => {
    const merged: SignedOrderModel[] = [];
    let l: number = 0;
    let r: number = 0;

    while (l < left.length && r < right.length) {
        const leftOrder: SignedOrderModel = left[l];
        const leftPrice: number = calcPrice(side, leftOrder);
        const rightOrder: SignedOrderModel = right[r];
        const rightPrice: number = calcPrice(side, rightOrder);

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
    side: OrderbookSide,
    signedOrderModels: Array<Required<SignedOrderModel>>,
): Array<Required<SignedOrderModel>> => {
    const totalOrders = signedOrderModels.length;
    if (totalOrders < 2) {
        return signedOrderModels;
    }
    const center = totalOrders / 2;
    const left = signedOrderModels.slice(0, center);
    const right = signedOrderModels.slice(center, totalOrders);

    return merge(side, mergeSortOrders(side, left), mergeSortOrders(side, right)) as Array<Required<SignedOrderModel>>;
};
