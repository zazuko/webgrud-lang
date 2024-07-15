grammar WebGrudDefinitions

entry Model:
    (cubes+=Cube | units+=Unit | factors+=Factor )*;

Cube:
    'cube' name=ID '{'
        'version' version=INT
        (dimensions+=Dimension)*
    '}';

Dimension:
    'dimension' name=ID  '{'
        'unit' unit=[Unit:ID]
    '}';

Unit:
    'unit' name=ID prefixedName=STRING;

Factor:
    'factor' name=ID '{'
        'from' 'cube' cube=[Cube:ID]  'dimension' dimension=[Dimension:ID]
        'label' label=STRING
    '}';

hidden terminal WS: /\s+/;
terminal ID: /[_a-zA-Z][\w_]*/;
terminal INT returns number: /[0-9]+/;
terminal STRING: /"(\\.|[^"\\])*"|'(\\.|[^'\\])*'/;

hidden terminal ML_COMMENT: /\/\*[\s\S]*?\*\//;
hidden terminal SL_COMMENT: /\/\/[^\n\r]*/;
