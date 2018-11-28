import { forEachField } from 'graphql-tools';
import { defaultFieldResolver } from 'graphql';
import { getDirectiveValues } from 'graphql/execution';
import * as graphqlLanguage from 'graphql/language';
import * as graphqlType from 'graphql/type';

const DirectiveLocation =
  graphqlLanguage.DirectiveLocation || graphqlType.DirectiveLocation;

function getFieldResolver(field) {
  const resolver = field.resolve || defaultFieldResolver;
  return resolver.bind(field);
}

function getDirectiveInfo(directive, resolverMap, schema, location, variables) {
  const name = directive.name.value;
  const Directive = schema.getDirective(name);
  if (typeof Directive === 'undefined') {
    throw new Error(
      `Directive @${name} is undefined. ` +
        'Please define in schema before using.',
    );
  }

  if (!Directive.locations.includes(location)) {
    throw new Error(
      `Directive @${name} is not marked to be used on "${location}" location. ` +
        `Please add "directive @${name} ON ${location}" in schema.`,
    );
  }

  const resolver = resolverMap[name];
  const args = getDirectiveValues(
    Directive,
    { directives: [directive] },
    variables,
  );
  return { args, resolver };
}

function createFieldExecutionResolver(field, resolverMap, schema) {
  const originalResolver = getFieldResolver(field);
  const { directives } = field.astNode;
  if (!directives.length) {
    return originalResolver;
  }

  return directives.reduce((recursiveResolver, directive) => {
    const directiveInfo = getDirectiveInfo(
      directive,
      resolverMap,
      schema,
      DirectiveLocation.FIELD_DEFINITION,
      undefined,
    );

    return (source, args, context, info) => {
      if (typeof directiveInfo.resolver === 'undefined') {
        return recursiveResolver(source, args, context, info);
      }

      const resolver = (
        sourceOverride = source,
        argsOverride = args,
        contextOverride = context,
        infoOverride = info,
      ) => {
        return recursiveResolver(
          sourceOverride,
          argsOverride,
          contextOverride,
          infoOverride,
        );
      };

      return directiveInfo.resolver(
        resolver,
        source,
        args,
        context,
        info,
        directiveInfo.args,
      );
    };
  }, originalResolver);
}

function createFieldResolver(field, resolverMap, schema) {
  const originalResolver = getFieldResolver(field);
  return (source, args, context, info) => {
    const { directives } = info.fieldNodes[0];
    if (!directives.length) {
      return originalResolver(source, args, context, info);
    }

    const fieldResolver = directives.reduce((recursiveResolver, directive) => {
      const directiveInfo = getDirectiveInfo(
        directive,
        resolverMap,
        schema,
        DirectiveLocation.FIELD,
        info.variableValues,
      );

      return () => {
        if (typeof directiveInfo.resolver === 'undefined') {
          return recursiveResolver(source, args, context, info);
        }

        const resolver = (
          sourceOverride = source,
          argsOverride = args,
          contextOverride = context,
          infoOverride = info,
        ) => {
          return recursiveResolver(
            sourceOverride,
            argsOverride,
            contextOverride,
            infoOverride,
          );
        };

        return directiveInfo.resolver(
          resolver,
          source,
          args,
          context,
          info,
          directiveInfo.args,
        );
      };
    }, originalResolver);

    return fieldResolver(source, args, context, info);
  };
}

function addQueryDirectives(schema, resolverMap) {
  if (typeof resolverMap !== 'object') {
    throw new Error(
      `Expected resolverMap to be of type object, got ${typeof resolverMap}`,
    );
  }

  if (Array.isArray(resolverMap)) {
    throw new Error('Expected resolverMap to be of type object, got Array');
  }

  forEachField(schema, field => {
    field.resolve = createFieldExecutionResolver(field, resolverMap, schema);
    field.resolve = createFieldResolver(field, resolverMap, schema);
  });
}

export default addQueryDirectives;
