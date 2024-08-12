grammar WebGrudDefinitions

entry Model:
    (cubes+=Cube | units+=Unit | factors+=Factor | values+=ValueDefinition | inputParameters+=InputParameter | nutrients+=Nutrient)*;

Cube:
    'table' name=ID '{'
        'version' version=INT
        (dimensions+=Dimension)*
    '}';

Dimension:
    'dimension' name=ID  ('{'
        'unit' unit=[Unit:ID]
    '}')?;

Unit:
    'unit' name=ID prefixedName=STRING;

// TODO: deprecated, remove later
Factor:
    'factor' name=ID '{'
        'from' 'table' cube=[Cube:ID] 'dimension' dimension=[Dimension:ID]
        'label' label=STRING
    '}';

ValueDefinition:
    'value' name=ID '=' value=(Value | ConditionalValue);

Value:
    UNDEFINED | numeric=INT | SourcedValue | SumValue | definition=[ValueDefinition:ID];

ConditionalValue:
    (conditions+=ConditionalBranch)+;

ConditionalBranch:
    'if' '(' comparisons=Comparisons ')' '{' value=Value '}' ;

Comparisons: conjunts+=Comparison ('and' conjunts +=Comparison)*;
Comparison: left=ValueOrLiteral op=ComparisonOperator right=ValueOrLiteral;
ValueOrLiteral: value=[ValueDefinition:ID] |  numeric=INT;
ComparisonOperator: value= ('=' | '<'); // etc..



SumValue:
    summands+=[ValueDefinition:ID] ('+' summands+=[ValueDefinition:ID])+;

// FormulaValue:
//     'calculation' name=ID '='
//         summands+=[Value:ID] ('+' summands+=[Value:ID])*;

SourcedValue:
    'from' 'table' cube=[Cube:ID]
    'where' conditions+=Condition
    ('and' conditions+=Condition)*
    'take' resultDimension=[Dimension:ID]
    ('default' defaultValue=INT)?;


Condition:
    NutrientEqualityCondition | StringEqualityCondition | InputEqualityCondition;

// TODO: maybe this should be stg like 'EnumValueEqualityCondition' with enum values coming from the cubes metadata ?
NutrientEqualityCondition:
    dimension=[Dimension:ID] 'is' nutrient=[Nutrient:ID];

StringEqualityCondition:
    dimension=[Dimension:ID] 'is' stringValue=STRING;

InputEqualityCondition:
    dimension=[Dimension:ID] 'is' 'input' inputParameter=[InputParameter:ID];

InputParameter:
    'input' 'parameter' name=ID;

Nutrient:
    'nutrient' name=ID;

hidden terminal WS: /\s+/;
terminal UNDEFINED: 'undefined';
terminal ID: /[_a-zA-Z][\w_]*/;
terminal INT returns number: /[0-9]+/;
terminal STRING: /"(\\.|[^"\\])*"|'(\\.|[^'\\])*'/;

hidden terminal ML_COMMENT: /\/\*[\s\S]*?\*\//;
hidden terminal SL_COMMENT: /\/\/[^\n\r]*/;
