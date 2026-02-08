// Language reference

const PREC = {
  PRIMARY: 16, // [] {x:y} () f(x) new x.y x[y] <></> @ :: ..
  POSTFIX: 15, // x++ x--
  UNARY: 14, // ++x --x + - ~ ! delete typeof void
  MULTIPLICATIVE: 13, // * / %
  ADDITIVE: 12, // + -
  BITWISE_SHIFT: 11, // << >> >>>
  RELATIONAL: 10, // < > <= >= as in instanceof is
  EQUALITY: 9, // == != === !==
  BITWISE_AND: 8, // &
  BITWISE_XOR: 7, // ^
  BITWISE_OR: 6, // |
  LOGICAL_AND: 5, // &&
  LOGICAL_OR: 4, // ||
  CONDITIONAL: 3, // ?: ?? =>
  ASSIGNEMENT: 2, // = *= /= %= += -= <<= >>= >>>= &= ^= |=
  COMMA: 1, // ,
}

module.exports = grammar({
  name: 'hexa',

  extras: ($) => [$.line_comment, $.block_comment, $.doc_comment, /\s/],

  supertypes: ($) => [
    $.statement,
    $.declaration,
    $.expression,
    $.primary_expression,
  ],

  conflicts: ($) => [
    [$.sequence_expression, $.pair],
    [$.primary_expression, $.for_in_statement],
    [$.class_declaration, $.enum_declaration],
  ],  word: ($) => $.identifier,

  inline: ($) => [$._expressions, $.statement, $._variable_declarator],

  rules: {
    program: ($) => repeat($.statement),

    _class_keyword: ($) => choice(seq('readonly', 'class'), 'class'),

    class_declaration: ($) =>
      seq(
        repeat(choice($.decorator, $.flag_decorator)),
        optional($.contract_decorator),
        field('keyword', $._class_keyword),
        field('name', $._type_identifier),
        optional(field('heritage', $.heritage)),
        field('body', $.class_body)
      ),

    enum_declaration: ($) =>
      seq(
        repeat($.decorator),
        optional(seq('@extensibleTags')),
        'enum',
        field('name', $._type_identifier),
        optional(field('heritage', $.heritage)),
        field('body', $.enum_body)
      ),

    enum_body: ($) =>
      seq('{', repeat($.enum_member), '}'),

    enum_member: ($) =>
      choice(
        seq(field('name', $._type_identifier), optional(field('payload', $.call_arguments))),
        $.field_signature,
        $.function_declaration
      ),

    type_alias_declaration: ($) =>
      seq(
        repeat($.decorator),
        'type',
        field('name', $._type_identifier),
        '=',
        field('value', $.type_literal)
      ),

    type_literal: ($) =>
      choice(
        $.object_type_literal,
        $.interface_type_literal
      ),

    interface_type_literal: ($) =>
      seq(
        'interface',
        $.object_type_literal
      ),

    object_type_literal: ($) =>
      seq('{', repeat($.type_member), '}'),

    type_member: ($) =>
      choice(
        seq('var', field('name', $.identifier), field('type', $._data_type)),
        seq('let', field('name', $.identifier), field('type', $._data_type)),
        seq('fun', field('name', $.identifier), field('parameters', $.function_parameters), optional(field('return_type', $._data_type)))
      ),

    decorator: ($) =>
      seq(
        '@',
        field('name', $.decorator_name),
        optional(field('arguments', $.call_arguments))
      ),

    decorator_name: ($) =>
      seq($.identifier, optional(seq('.', $.identifier))),

    class_body: ($) =>
      seq('{', repeat($.class_member), '}'),

    class_member: ($) =>
      choice(
        $.variable_declaration,
        $.constant_declaration,
        $.function_declaration,
        $.constructor_declaration,
        $.class_declaration,
        $.interface_declaration,
        $.type_alias_declaration,
        $.enum_declaration
      ),

    constructor_declaration: ($) =>
      seq(
        repeat($.decorator),
        optional('private'),
        'new',
        field('parameters', $.function_parameters),
        field('body', $.statement_block)
      ),

    interface_declaration: ($) =>
      seq(
        repeat($.decorator),
        'interface',
        field('name', $._type_identifier),
        optional(field('heritage', $.heritage)),
        '{',
        field('body', repeat($.interface_member)),
        '}'
      ),

    interface_member: ($) =>
      choice($.function_signature, $.field_signature),

    function_signature: ($) =>
      seq(
        repeat($.decorator),
        'fun',
        field('name', $.identifier),
        field('parameters', $.function_parameters),
        optional(field('return_type', alias($._data_type, $.type_hint))),
        optional($.statement_terminator)
      ),

    field_signature: ($) =>
      seq(
        repeat($.decorator),
        choice('var', 'let'),
        field('name', $.identifier),
        field('type', alias($._data_type, $.type_hint)),
        optional($.statement_terminator)
      ),

    function_declaration: ($) =>
      seq(
        repeat(choice($.decorator, $.flag_decorator)),
        optional($.contract_decorator),
        optional('async'),
        choice('fun', 'function'),
        field('name', $.identifier),
        field('parameters', $.function_parameters),
        optional(field('return_type', alias($._data_type, $.type_hint))),
        field('body', $.statement_block)
      ),

    function_parameters: ($) =>
      seq(
        '(',
        optional(
          sep1(
            choice(
              seq(
                repeat($.decorator),
                field('name', $.identifier),
                optional(field('type', alias($._data_type, $.type_hint))),
                optional(field('default', seq('=', $.expression)))
              ),
              $.rest
            ),
            ','
          )
        ),
        ')'
      ),

    variable_declaration: ($) =>
      seq(
        repeat($.decorator),
        repeat($.property_attribut),
        $._variable_declarator,
        optional($.statement_terminator)
      ),

    _variable_declarator: ($) =>
      seq(
        'var',
        field('name', $.identifier),
        optional(field('type', alias($._data_type, $.type_hint))),
        optional(seq('=', field('value', $.expression)))
      ),

    constant_declaration: ($) =>
      seq(
        repeat($.decorator),
        repeat($.property_attribut),
        'let',
        field('name', $.identifier),
        optional(field('type', alias($._data_type, $.type_hint))),
        optional(seq('=', field('value', $.expression))),
        optional($.statement_terminator)
      ),

    property_attribut: ($) =>
      choice('declare', 'private', 'static', 'readonly'),

    rest: ($) => seq('...', field('name', $.identifier), optional(field('type', alias($._data_type, $.type_hint)))),

    statement_terminator: ($) => choice(';'),

    // Statements

    statement: ($) =>
      choice(
        $.declaration,
        $.expression_statement,
        $.statement_block,
        $.if_statement,
        $.switch_statement,
        $.for_in_statement,
        $.while_statement,
        $.do_statement,
        $.try_statement,
        $.break_statement,
        $.continue_statement,
        $.return_statement,
        $.throw_statement,
        $.guard_statement
      ),

    expression_statement: ($) => seq($._expressions, optional($.statement_terminator)),

    statement_block: ($) => seq('{', repeat($.statement), '}'),

    if_statement: ($) =>
      prec.right(
        seq(
          choice(
            seq('if', field('condition', $._expressions)),
            seq('if', 'let', field('binding', $.let_binding), optional(seq(',', field('additional_conditions', repeat1($.let_condition))))),
            seq('if', 'let', field('binding', $.let_binding), optional(seq(',', field('additional_conditions', repeat1($.let_condition)))), 'else', field('alternative', $.else_clause))
          ),
          field('consequence', $.statement_block),
          optional(field('alternative', $.else_clause))
        )
      ),

    else_clause: ($) => seq('else', choice($.if_statement, $.statement_block)),

    switch_statement: ($) =>
      seq('switch', field('value', $._expressions), field('body', $.switch_body)),
    switch_body: ($) => seq('{', repeat(choice($.switch_case, $.switch_default)), '}'),
    switch_case: ($) =>
      seq('case', field('value', choice(
        $.expression, 
        $.type_pattern,
        // Flag patterns: Read | Write | Execute
        seq(
          optional(sep1(field('flag', $.identifier), '|')),
          '|',
          choice(
            field('flag', $.identifier),
            '_',
            seq('not', field('flag', $.identifier)),
            seq('(', field('flags', $.identifier), ')')
          ),
          optional(seq('|', repeat1(choice(
            field('flag', $.identifier),
            '_',
            seq('not', field('flag', $.identifier))
          ))))
        )
      )), ':', field('body', repeat($.statement))),
    switch_default: ($) => seq('case', '_', ':', field('body', repeat($.statement))),

    for_in_statement: ($) =>
      seq(
        'for',
        field('left', $.for_binding),
        'in',
        field('right', $.for_iterable),
        field('body', $.statement_block)
      ),

    for_binding: ($) =>
      choice(
        seq(field('name', $.identifier), optional('!')),
        seq(field('key', $.identifier), ':', field('value', $.identifier), optional('!'))
      ),

    for_iterable: ($) =>
      choice(
        $.range_expression,
        $.expression
      ),

    range_expression: ($) =>
      prec.left(PREC.RELATIONAL, seq($.expression, '...', $.expression)),

    while_statement: ($) =>
      choice(
        seq('while', field('condition', $._expressions), field('body', $.statement_block)),
        seq('while', 'let', field('binding', $.let_binding), optional(seq(',', field('additional_conditions', repeat1($.let_condition)))), field('body', $.statement_block))
      ),

    do_statement: ($) =>
      seq(
        'do',
        field('body', $.statement_block),
        'while',
        field('condition', $._expressions),
        optional($.statement_terminator)
      ),

    try_statement: ($) =>
      seq(
        'try',
        field('body', $.statement_block),
        field('handler', repeat1($.catch_clause))
      ),
    catch_clause: ($) =>
      seq(
        'catch',
        field('parameter', $.identifier),
        field('type', alias($._data_type, $.type_hint)),
        optional(field('guard', choice(
          seq('if', $._expressions),
          seq('if', 'let', field('binding', $.let_binding), optional(seq(',', field('additional_conditions', repeat1($.let_condition)))))
        ))),
        field('body', $.statement_block)
      ),

    break_statement: ($) => seq('break'),

    continue_statement: ($) => seq('continue'),

    return_statement: ($) => prec.right(seq('return', optional($.expression))),

    throw_statement: ($) => prec.left(seq('throw', optional($.expression))),

    guard_statement: ($) => 
      choice(
        seq('guard', $._expressions, 'else', $.statement_block),
        seq('guard', 'let', field('binding', $.let_binding), optional(seq(',', field('additional_conditions', repeat1($.let_condition)))), 'else', $.statement_block)
      ),

    // labeled statements are intentionally not supported (per reference)

    // Expressions

    _expressions: ($) => choice($.expression, $.sequence_expression),

    sequence_expression: ($) =>
      seq(
        field('left', $.expression),
        ',',
        field('right', choice($.expression, $.sequence_expression))
      ),

    expression: ($) =>
      choice(
        $.primary_expression,
        $.assignment_expression,
        $.augmented_assignment_expression,
        $.unary_expression,
        $.binary_expression,
        $.ternary_expression,
        $.update_expression,
        $.force_unpack_expression,
        $.spread_expression,
        $.cascade_expression
      ),

    primary_expression: ($) =>
      choice(
        $.subscript_expression,
        $.member_expression,
        $.parenthesized_expression,
        $.identifier,
        $.regex,
        $.true,
        $.false,
        $.null,
        $.number,
        $.string,
        $.jsx_element,
        $.tagged_template,
        $.meta_expression,
        $.array,
        $.object,
        $.map,
        $.anonymous_function,
        $.call_expression,
        $.decorated_expression,
        $.await_expression
      ),

    decorated_expression: ($) =>
      prec(PREC.PRIMARY, seq(repeat1($.decorator), $.expression)),

    await_expression: ($) =>
      prec(PREC.PRIMARY, seq('await', $.expression)),

    subscript_expression: ($) =>
      prec(
        PREC.PRIMARY,
        seq(
          field('object', choice($.expression)),
          '[',
          field('index', $.expression),
          ']',
          optional('?')
        )
      ),

    member_expression: ($) =>
      prec(
        PREC.PRIMARY,
        seq(
          field('object', choice($.expression)),
          '.',
          field('property', $.identifier),
          optional('?')
        )
      ),

    // descendant (..) and namespace (::) access are not part of the new syntax

    parenthesized_expression: ($) =>
      prec(PREC.PRIMARY, seq('(', $._expressions, ')')),

    object: ($) =>
      prec(PREC.PRIMARY, seq('{', optional(sep1(choice($.object_field, $.spread_expression), ',')), '}')),

    object_field: ($) =>
      choice(
        seq(field('name', $.identifier), ':', field('value', $.expression)),
        field('shorthand', $.identifier),
        seq('...', field('rest', $.identifier))  // Spread
      ),

    map: ($) =>
      prec(
        PREC.PRIMARY,
        seq('[', optional(sep1(choice($.pair, $.spread_expression), ',')), ']')
      ),

    pair: ($) =>
      seq(
        field('key', choice($.string, $.number, $.true, $.false, $.null, $.identifier, seq('(', $.expression, ')'))),
        ':',
        field('value', $.expression)
      ),

    array: ($) =>
      prec(PREC.PRIMARY + 1, seq('[', optional(sep1(choice($.expression, $.spread_expression), ',')), ']')),

    // vector and xml literals are not part of the new syntax

    anonymous_function: ($) =>
      prec(
        PREC.PRIMARY,
        seq(
          'fun',
          optional(field('name', $.identifier)),
          field('parameters', $.function_parameters),
          optional(field('return_type', alias($._data_type, $.type_hint))),
          field('body', $.statement_block)
        )
      ),

    call_expression: ($) =>
      prec(
        PREC.PRIMARY,
        seq(
          field('fun', $.expression),
          field('arguments', $.call_arguments)
        )
      ),

    call_arguments: ($) =>
      seq(
        '(',
        optional(sep1(choice($.named_argument, $.expression), ',')),
        ')'
      ),

    named_argument: ($) =>
      seq(field('name', $.identifier), ':', field('value', $.expression)),

    assignment_expression: ($) =>
      prec(
        PREC.ASSIGNEMENT,
        seq(
          field(
            'left',
            choice($.member_expression, $.subscript_expression, $.identifier)
          ),
          '=',
          field('right', $.expression)
        )
      ),

    augmented_assignment_expression: ($) =>
      prec(
        PREC.ASSIGNEMENT,
        seq(
          field(
            'left',
            choice($.member_expression, $.subscript_expression, $.identifier)
          ),
          field(
            'operator',
            choice(
              '*=',
              '/=',
              '%=',
              '+=',
              '-=',
              '<<=',
              '>>=',
              '>>>=',
              '&=',
              '^=',
              '|='
            )
          ),
          field('right', $.expression)
        )
      ),

    unary_expression: ($) =>
      prec(
        PREC.UNARY,
        seq(
          field('operator', choice('-', '~', 'not')),
          field('argument', $.expression)
        )
      ),

    binary_expression: ($) =>
      choice(
        ...[
          ['*', PREC.MULTIPLICATIVE],
          ['/', PREC.MULTIPLICATIVE],
          ['%', PREC.MULTIPLICATIVE],
          ['+', PREC.ADDITIVE],
          ['-', PREC.ADDITIVE],
          ['<<', PREC.BITWISE_SHIFT],
          ['>>', PREC.BITWISE_SHIFT],
          ['>>>', PREC.BITWISE_SHIFT],
          ['<', PREC.RELATIONAL],
          ['>', PREC.RELATIONAL],
          ['<=', PREC.RELATIONAL],
          ['>=', PREC.RELATIONAL],
          ['in', PREC.RELATIONAL],
          ['==', PREC.EQUALITY],
          ['!=', PREC.EQUALITY],
          // strict equality operators are not part of Hexa
          ['&', PREC.BITWISE_AND],
          ['^', PREC.BITWISE_XOR],
          ['|', PREC.BITWISE_OR],
          ['and', PREC.LOGICAL_AND],
          ['or', PREC.LOGICAL_OR],
          ['??', PREC.CONDITIONAL],
        ].map(([op, pre]) =>
          prec.left(pre, seq($.expression, op, $.expression))
        )
      ),

    cast_expression: ($) =>
      prec.left(PREC.RELATIONAL, seq($.expression, 'as', $._data_type)),

    ternary_expression: ($) =>
      prec.right(
        PREC.CONDITIONAL,
        seq(
          field('condition', $.expression),
          '?',
          field('iftrue', $.expression),
          ':',
          field('iffalse', $.expression)
        )
      ),

    update_expression: ($) =>
      choice(
        prec(
          PREC.POSTFIX,
          seq(
            field('argument', $.expression),
            field('operator', choice('++', '--'))
          )
        ),
        prec(
          PREC.UNARY,
          seq(
            field('operator', choice('++', '--')),
            field('argument', $.expression)
          )
        )
      ),

    force_unpack_expression: ($) =>
      prec(PREC.POSTFIX, seq(
        field('argument', $.expression),
        '!'
      )),

    spread_expression: ($) =>
      prec(PREC.POSTFIX, seq(
        '...',
        field('argument', $.expression)
      )),
    // `new` keyword is not used in Hexa

    // Data types

    heritage: ($) => repeat1($._data_type),

    _data_type: ($) =>
      prec.right(
        choice(
          $.nullable_type,
          $.array_type,
          $.map_type,
          $.identifier,
          $._type_identifier,
          $.generic_data_type,
          $.scoped_data_type
        )
      ),

    nullable_type: ($) => seq(field('base', choice($.array_type, $.map_type, $.identifier, $._type_identifier, $.generic_data_type, $.scoped_data_type)), '?'),

    array_type: ($) => seq('[', $._data_type, ']'),
    map_type: ($) => seq('[', field('key', $._data_type), ':', field('value', $._data_type), ']'),

    generic_data_type: ($) =>
      seq(
        choice($.identifier, $._type_identifier),
        '<',
        field('type_parameters', sep1($._data_type, ',')),
        '>'
      ),

    scoped_data_type: ($) => seq(choice($.identifier, $._type_identifier), '.', $._data_type),

    _type_identifier: ($) => /[A-Z][A-Za-z0-9_]*/,

    // Primitive

    true: ($) => 'true',
    false: ($) => 'false',
    null: ($) => 'null',

    // from https://github.com/tree-sitter/tree-sitter-javascript/blob/master/grammar.js
    number: ($) => {
      const hex_literal = seq(choice('0x', '0X'), /[\da-fA-F](_*[\da-fA-F])*/)

      const decimal_digits = /\d(_*\d)*/
      const signed_integer = seq(optional(choice('-', '+')), decimal_digits)
      const exponent_part = seq(choice('e', 'E'), signed_integer)

      const binary_literal = seq(choice('0b', '0B'), /[0-1](_*[0-1])*/)

      const octal_literal = seq(choice('0o', '0O'), /[0-7](_*[0-7])*/)

      const bigint_literal = seq(
        choice(hex_literal, binary_literal, octal_literal, decimal_digits),
        'n'
      )

      const decimal_integer_literal = choice(
        '0',
        seq(optional('0'), /[1-9]/, optional(seq(repeat('_'), decimal_digits)))
      )

      const decimal_literal = choice(
        seq(
          decimal_integer_literal,
          '.',
          optional(decimal_digits),
          optional(exponent_part)
        ),
        seq('.', decimal_digits, optional(exponent_part)),
        seq(decimal_integer_literal, exponent_part),
        seq(decimal_digits)
      )

      // Numeric constants
      const nan = 'NaN'
      const pInfinity = 'Infinity'
      const mInfinity = '-Infinity'

      return token(
        choice(
          hex_literal,
          decimal_literal,
          binary_literal,
          octal_literal,
          bigint_literal,
          nan,
          pInfinity,
          mInfinity
        )
      )
    },

    // number: ($) =>
    //   choice(
    //     $._nan,
    //     $._pInfinity,
    //     $._mInfinity,
    //     $._hex_literal,
    //     $._decimal_literal
    //   ),

    // _hex_literal: ($) => seq(choice('0x', '0X'), /[0-9a-fA-F][0-9a-fA-F_]*/),
    // // _hex_literal: ($) => seq(choice('0x', '0X'), sep1(/[0-9a-fA-F]+/, /_+/)),
    // // TODO: Octal should be 0777 like numbers
    // // _oct_literal: ($) => '',

    // _integer_literal: ($) => /[0-9][0-9_]*/,
    // _exponential_part: ($) =>
    //   seq(choice('e', 'E'), optional(choice('+', '-')), $._integer_literal),
    // _decimal_literal: ($) =>
    //   prec.right(
    //     seq(
    //       $._integer_literal,
    //       optional(seq('.', $._integer_literal)),
    //       optional($._exponential_part)
    //     )
    //   ),

    // String literals

    // From tree-sitter-javascript string literal
    // https://github.com/tree-sitter/tree-sitter-javascript/blob/master/grammar.js
    string: ($) =>
      choice(
        seq(
          '"',
          repeat(
            choice($._unescaped_double_string_fragment, $._escape_sequence)
          ),
          '"'
        ),
        seq(
          "'",
          repeat(
            choice($._unescaped_single_string_fragment, $._escape_sequence)
          ),
          "'"
        ),
        seq(
          "`",
          repeat(
            choice($._unescaped_backtick_string_fragment, $._escape_sequence)
          ),
          "`"
        )
      ),

    _unescaped_double_string_fragment: ($) =>
      token.immediate(prec(1, /[^"\\]+/)),

    _unescaped_single_string_fragment: ($) =>
      token.immediate(prec(1, /[^'\\]+/)),

    _unescaped_backtick_string_fragment: ($) =>
      token.immediate(prec(1, /[^`\\]+/)),

    _escape_sequence: ($) =>
      token.immediate(
        seq(
          '\\',
          choice(
            /[^xu0-7]/,
            /[0-7]{1,3}/,
            /x[0-9a-fA-F]{2}/,
            /u[0-9a-fA-F]{4}/,
            /u{[0-9a-fA-F]+}/
          )
        )
      ),

    regex: ($) =>
      seq(
        '/',
        field('pattern', $.regex_pattern),
        token.immediate('/'),
        optional(field('flags', $.regex_flags))
      ),

    regex_pattern: ($) =>
      token.immediate(
        prec(
          -1,
          repeat1(
            choice(
              seq(
                '[',
                repeat(
                  choice(
                    seq('\\', /./), // escaped character
                    /[^\]\n\\]/ // any character besides ']' or '\n'
                  )
                ),
                ']'
              ), // square-bracket-delimited character class
              seq('\\', /./), // escaped character
              /[^/\\\[\n]/ // any character besides '[', '\', '/', '\n'
            )
          )
        )
      ),

    regex_flags: ($) => token.immediate(/[a-z]+/),

    // identifiers: lowerCamelCase / snake_case (Unicode intentionally not supported)
    identifier: ($) => /[a-z_][A-Za-z0-9_]*/,

    // Comments

    comment: ($) => choice($.line_comment, $.block_comment),
    line_comment: ($) => token(seq('//', /[^\n]*/)),
    block_comment: ($) => token(seq('/*', /[^*]*\*+([^/*][^*]*\*+)*/, '/')),

    // Binding patterns for if let, while let, guard statements
    let_binding: ($) =>
      choice(
        field('name', $.identifier),
        seq(field('name', $.identifier), '=', field('value', $.expression))
      ),

    let_condition: ($) =>
      choice(
        seq('let', field('binding', $.let_binding)),
        $.expression
      ),

    // Cascade expressions for object and array/map modifications
    cascade_expression: ($) =>
      prec.right(PREC.POSTFIX, seq(
        field('target', $.expression),
        choice(
          // Object cascade: obj.{ x: 1, y: 2 }
          seq(
            '.{',
            optional(sep1($.object_field, ',')),
            '}'
          ),
          // Array/Map cascade: array.[ 0: 1, 1: 2 ]
          seq(
            '.[',
            optional(sep1($.pair, ',')),
            ']'
          )
        )
      )),

    // For expression comprehensions
    for_expression: ($) =>
      seq(
        'for',
        field('binding', $.for_binding),
        'in',
        field('iterable', $.expression),
        field('body', $.statement_block)
      ),
    // Cast expressions
    cast_expression: ($) =>
      prec(PREC.POSTFIX, seq(
        field('target', $.expression),
        '.as',
        '(',
        field('type', choice($._data_type, '_')),
        optional(seq(',', field('mode', choice(
          $.string,  // 'null', 'throw', 'force', 'static_cast', etc.
          $.identifier  // variable containing cast mode
        )))),
        ')'
      )),

    // Contract decorators
    contract_decorator: ($) =>
      seq(
        '@verify',
        '{',
        repeat(
          choice(
            // Simple boolean expression
            $.expression,
            // @save clause
            seq(
              '@save',
              field('variable', $.identifier),
              'as',
              field('alias', $.identifier)
            ),
            // @returns clause
            seq(
              '@returns',
              '{',
              repeat($.expression),
              '}'
            ),
            // @throws clause
            seq(
              '@throws',
              '{',
              repeat($.expression),
              '}'
            ),
            // Inline block
            seq(
              '{',
              repeat($.expression),
              '}'
            )
          )
        ),
        '}'
      ),

    // Enum flags
    enum_flags: ($) =>
      seq(
        '@flags',
        'enum',
        field('name', $.identifier),
        optional(seq(':', field('base_type', $._type_identifier))),
        '{',
        repeat(
          seq(
            field('member', $.identifier),
            optional(seq('=', field('value', $.expression)))
          )
        ),
        '}'
      ),

    // Documentation comments
    doc_comment: ($) =>
      token(prec(-1, /\/\/\/[^\n\r]*/)),

    // Flag enforcement decorators
    flag_decorator: ($) =>
      choice(
        seq('@flagOnce', '(', field('flag', $.string), ')'),
        seq('@flagRequireOnce', '(', field('flag', $.string), optional(seq(',', field('message', $.string))), ')'),
        seq('@flagDeferRequireOnce', '(', field('flag', $.string), ')'),
        seq('@unflag', '(', field('flag', $.string), ')')
      ),

    // JSX expressions
    jsx_element: ($) =>
      choice(
        // Self-closing tag: <img />
        seq(
          '<',
          field('tag_name', $.identifier),
          repeat($.jsx_attribute),
          '/>',
          optional(field('children', $.jsx_children))
        ),
        // Opening/closing tag: <div></div>
        seq(
          '<',
          field('tag_name', $.identifier),
          repeat($.jsx_attribute),
          '>',
          optional(field('children', $.jsx_children)),
          '</',
          field('closing_tag', $.identifier),
          '>'
        ),
        // Fragment: <>content</>
        seq(
          '<>',
          optional(field('children', $.jsx_children)),
          '</>'
        )
      ),

    jsx_attribute: ($) =>
      choice(
        // Simple attribute: type="text"
        seq(
          field('name', $.identifier),
          '=',
          field('value', choice($.string, $.jsx_expression))
        ),
        // Spread attribute: {...props}
        seq(
          '...',
          field('spread', $.identifier)
        )
      ),

    jsx_children: ($) =>
      repeat1(
        choice(
          $.jsx_element,
          $.jsx_expression,
          $.string,
          $.identifier
        )
      ),

    jsx_expression: ($) =>
      seq(
        '{',
        choice(
          $.expression,
          $.if_statement,
          $.for_in_statement,
          $.switch_statement
        ),
        '}'
      ),

    // Tagged template literals
    tagged_template: ($) =>
      prec(PREC.PRIMARY + 1, seq(
        field('tag', choice($.identifier, $.meta_expression)),
        choice(
          // Backticks: html`content`
          seq('`', repeat(choice($.string, $.identifier, $.expression)), '`'),
          // Double quotes: css"content"
          seq('"', repeat(choice($.string, $.identifier, $.expression)), '"'),
          // Triple quotes: gql```content```
          seq('```', repeat(choice($.string, $.identifier, $.expression)), '```')
        )
      )),

    // Meta expressions
    meta_expression: ($) =>
      seq(
        'meta',
        '.',
        field('property', choice(
          'defined', 'int', 'string', 'bool', 'target', 'architecture', 'platform',
          'isDebug', 'version', 'buildTimestamp', 'getMethods', 'getProperties', 'getFields',
          'custom', 'position', 'trace', 'diagnostic', 'agnostic', 'scream',
          'fieldNames', 'hasField', 'echo', 'validate', 'offsetOf', 'sizeOf',
          'getDefineAs', 'collection', 'assumeNotNull', 'assumeNonEmpty'
        ))
      ),

    // Import statements
    import_statement: ($) =>
      seq(
        optional('@export'),
        'import',
        choice(
          // import Module
          field('module', $.identifier),
          // import { items } from Module
          seq(
            '{',
            sep1(
              seq(
                field('name', $.identifier),
                optional(seq('as', field('alias', $.identifier))),
                optional(seq(':', repeat1(field('method', $.identifier))))
              ),
              ','
            ),
            '}',
            'from',
            field('source', $.identifier)
          ),
          // import Module.Type
          seq(
            field('module', $.identifier),
            '.',
            field('type', $.identifier),
            optional(seq('as', field('alias', $.identifier)))
          ),
          // import Deep.Nested.Module.Type
          seq(
            repeat1(seq(field('module', $.identifier), '.')),
            field('type', $.identifier),
            optional(seq('as', field('alias', $.identifier)))
          ),
          // import Module as Alias
          seq(
            field('module', $.identifier),
            'as',
            field('alias', $.identifier)
          )
        )
      ),

    // Preprocessor directives
    preprocessor_directive: ($) =>
      seq(
        '#if',
        field('condition', choice(
          // meta.defined('debug')
          seq($.meta_expression, '(', field('define', $.string), ')'),
          // meta.int('apiLevel') >= 2
          seq($.meta_expression, '(', field('define', $.string), ')', choice('>=', '<', '==', '!='), field('value', choice($.string, $.number))),
          // mode == Mode.Debug
          seq(field('variable', $.identifier), choice('==', '!='), field('value', choice($.string, $.identifier))),
          // Complex expressions with and/or
          seq(
            field('left', choice(
              seq($.meta_expression, '(', field('define', $.string), ')'),
              seq($.meta_expression, '(', field('define', $.string), ')', choice('>=', '<', '==', '!='), field('value', choice($.string, $.number))),
              seq(field('variable', $.identifier), choice('==', '!='), field('value', choice($.string, $.identifier)))
            )),
            choice('and', 'or'),
            field('right', choice(
              seq($.meta_expression, '(', field('define', $.string), ')'),
              seq($.meta_expression, '(', field('define', $.string), ')', choice('>=', '<', '==', '!='), field('value', choice($.string, $.number))),
              seq(field('variable', $.identifier), choice('==', '!='), field('value', choice($.string, $.identifier)))
            ))
          )
        )),
        optional(seq('#else', field('else_condition', choice(
          $.preprocessor_directive,
          repeat($.statement)
        )))),
        '#endif'
      ),

    declaration: ($) =>
      choice(
        $.variable_declaration,
        $.constant_declaration,
        $.function_declaration,
        $.class_declaration,
        $.interface_declaration,
        $.type_alias_declaration,
        $.enum_declaration,
        $.enum_flags,
        $.import_statement,
        $.preprocessor_directive
      ),

    // Type patterns for switch case matching
    type_pattern: $ =>
      choice(
        // Type with optional binding: Int(value), String(name)
        seq(
          field('type', choice($.identifier, $._type_identifier, $.generic_data_type)),
          optional(field('binding', seq('(', field('name', $.identifier), ')'))),
          optional(field('guard', seq('if', $._expressions)))
        ),
        // Array destructuring pattern: [key, value]
        seq(
          '[',
          optional(sep1(
            choice(
              field('element', $.identifier),
              seq(field('element', $.identifier), '?'),  // Optional element
              seq(field('element', $.identifier), ':', field('value', $.expression)),  // Key-value in array
              field('element', $.null),  // Null literal
              field('element', $.number),  // Literal values
              field('element', $.string),
              field('element', '_'),  // Wildcard
              seq('...', field('rest', choice($.identifier, '_'))),  // Spread
              alias($.type_pattern, 'nested_array_pattern')  // Nested array pattern - recursive
            ),
            ','
          )),
          ']',
          optional(field('guard', seq('if', $._expressions)))
        ),
        // Map pattern: ["key": "value", ...rest]
        seq(
          '[',
          optional(sep1(
            choice(
              seq(field('key', $.string), ':', field('value', $.string)),  // String key-value
              seq(field('key', $.identifier), ':', field('value', $.identifier)),  // Id key-value
              seq(field('key', $.identifier), ':', field('value', $.string)),  // Id-string key-value
              seq('_', ':', field('value', $.identifier)),  // Wildcard key
              seq(field('key', $.identifier), ':', '_'),  // Wildcard value
              seq('...', field('rest', choice($.identifier, '_')))  // Spread
            ),
            ','
          )),
          ']',
          optional(field('guard', seq('if', $._expressions)))
        ),
        // Object pattern: { x: 1, y: 2 }
        seq(
          '{',
          optional(sep1(
            seq(field('key', $.identifier), ':', field('value', $.expression)),
            ','
          )),
          '}',
          optional(field('guard', seq('if', $._expressions)))
        ),
        // Range pattern: _ ... 123, 1 ... 123, 123 ... _
        seq(
          field('start', choice('_', $.expression)),
          '...',
          field('end', choice('_', $.expression)),
          optional(field('guard', seq('if', $._expressions)))
        ),
        // Simple identifier with guard: x if x > 10
        seq(
          field('name', $.identifier),
          field('guard', seq('if', $._expressions))
        ),
        // Wildcard with guard: _ if array.length == 0
        seq(
          '_',
          field('guard', seq('if', $._expressions))
        )
      )
  }
})

function sep1(rule, separator) {
  return seq(rule, repeat(seq(separator, rule)))
}

function caseInsensitive(keyword) {
  return new RegExp(
    keyword
      .split('')
      .map((letter) => `[${letter}${letter.toUpperCase()}]`)
      .join('')
  )
}
