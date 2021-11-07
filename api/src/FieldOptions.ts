import { DirectiveArgs } from "./Fetcher";
import { UnresolvedVariables } from "./Parameter";

export interface FieldOptions<
    TAlias extends string, 
    TDirectives extends { readonly [key: string]: DirectiveArgs },
    TDirectiveVariables extends object
> {
    
    alias<XAlias extends string>(alias: XAlias): FieldOptions<XAlias, TDirectives, TDirectiveVariables>;

    directive<
        XDirective extends string, 
        XArgs extends DirectiveArgs = {}
    >(
        directive: XDirective, 
        args?: XArgs
    ): FieldOptions<
        TAlias, 
        TDirectives & { readonly [key in XDirective]: XArgs },
        TDirectiveVariables & UnresolvedVariables<XArgs, Record<keyof XArgs, any>>
    >;

    readonly value: FieldOptionsValue;

    " $suppressWarnings"(alias: TAlias, directives: TDirectives, directiveVariables: TDirectiveVariables): void;
}

class FieldOptionsImpl<
    TAlias extends string, 
    TDirectives extends { readonly [key: string]: DirectiveArgs },
    TDirectiveVariables extends object
> implements FieldOptions<TAlias, TDirectives, TDirectiveVariables> {

    private _value?: FieldOptionsValue;

    constructor(
        private _prev?: FieldOptionsImpl<string, any, any>, 
        private _alias?: string, 
        private _directive?: string,
        private _directiveArgs?: object
    ) {
    }

    alias<XAlias extends string>(alias: XAlias): FieldOptions<XAlias, TDirectives, TDirectiveVariables> {
        return new FieldOptionsImpl<XAlias, TDirectives, TDirectiveVariables>(this, alias);
    }

    directive<
        XDirective extends string, 
        XArgs extends DirectiveArgs = {}
    >(
        directive: XDirective, 
        args?: XArgs
    ): FieldOptions<
        TAlias, 
        TDirectives & { readonly [key in XDirective]: XArgs},
        TDirectiveVariables & UnresolvedVariables<XArgs, Record<keyof XArgs, any>>
    > {
        if (directive.startsWith("@")) {
            throw new Error("directive name should not start with '@' because it will be prepended by this framework automatically");
        }
        return new FieldOptionsImpl<
            TAlias, 
            TDirectives & { readonly [key in XDirective]: XArgs},
            TDirectiveVariables & UnresolvedVariables<XArgs, XArgs>
        >(this, undefined, directive, args);
    }

    get value(): FieldOptionsValue {
        let v = this._value;
        if (v === undefined) {
            this._value = v = this.createValue();
        }
        return v;
    }

    private createValue(): FieldOptionsValue {
        let alias: string | undefined = undefined;
        const directives = new Map<string, DirectiveArgs>();
        for (let options: FieldOptionsImpl<string, any, any> | undefined = this; options !== undefined; options = options._prev) {
            if (options._alias !== undefined && alias === undefined) {
                alias = options._alias;
            }
            if (options._directive !== undefined && !directives.has(options._directive)) {
                const args = options._directiveArgs;
                directives.set(options._directive, args !== undefined && Object.keys(args).length !== 0 ? args : undefined);
            }
        }
        return { alias, directives };
    }

    " $suppressWarnings"(alias: TAlias, directives: TDirectives, directiveVariables: TDirectiveVariables): void {
        throw new Error('" $suppressWarnings" is unsupported');
    }
}

export interface FieldOptionsValue {
    readonly alias?: string;
    readonly directives: ReadonlyMap<string, DirectiveArgs>;
}

export function createFieldOptions<TAlias extends string>(): FieldOptions<TAlias, {}, {}> {
    return new FieldOptionsImpl<TAlias, {}, {}>();
}