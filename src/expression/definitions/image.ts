import {ResolvedImageType, StringType} from '../types';
import {ResolvedImage} from '../types/resolved_image';

import type {Expression} from '../expression';
import type {EvaluationContext} from '../evaluation_context';
import type {ParsingContext} from '../parsing_context';
import type {Type} from '../types';

export class ImageExpression implements Expression {
    type: Type;
    input: Expression;
    /**
     * The values for the slots of an SVG template, by slot name (`['image', name, {params: {...}}]`). Each value is
     * an expression. A renderer that has no templates, as MapLibre GL JS, resolves the image by its name alone.
     */
    params: Record<string, Expression> | undefined;

    constructor(input: Expression, params?: Record<string, Expression>) {
        this.type = ResolvedImageType;
        this.input = input;
        this.params = params;
    }

    static parse(args: ReadonlyArray<unknown>, context: ParsingContext): Expression {
        if (args.length !== 2 && args.length !== 3) {
            return context.error('Expected two or three arguments.') as null;
        }

        const name = context.parse(args[1], 1, StringType);
        if (!name) return context.error('No image name provided.') as null;

        if (args.length === 2) return new ImageExpression(name);

        const options = args[2];
        if (typeof options !== 'object' || options === null || Array.isArray(options)) {
            return context.error('The third argument of "image" must be an object, as {"params": {...}}.', 2) as null;
        }
        for (const key in options) {
            if (key !== 'params') return context.error(`Unknown option "${key}" of "image". The only option is "params".`, 2) as null;
        }
        const raw = (options as {params?: unknown}).params;
        if (raw === undefined) return new ImageExpression(name);
        if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
            return context.error('"params" of "image" must be an object of expressions by slot name.', 2) as null;
        }
        const params: Record<string, Expression> = {};
        for (const key in raw) {
            const value = context.parse((raw as Record<string, unknown>)[key], 2);
            if (!value) return null;
            params[key] = value;
        }
        return new ImageExpression(name, params);
    }

    evaluate(ctx: EvaluationContext) {
        const evaluatedImageName = this.input.evaluate(ctx);

        const value = ResolvedImage.fromString(evaluatedImageName);
        if (value && ctx.availableImages)
            value.available = ctx.availableImages.indexOf(evaluatedImageName) > -1;

        return value;
    }

    eachChild(fn: (_: Expression) => void) {
        fn(this.input);
        if (this.params) for (const key in this.params) fn(this.params[key]);
    }

    outputDefined() {
        // The output of image is determined by the list of available images in the evaluation context
        return false;
    }
}
