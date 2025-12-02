const fs = require('fs');

let content = fs.readFileSync('./server.js', 'utf8');

// Replace CONCAT with PostgreSQL || operator
// This handles the most common pattern: CONCAT(arg1, ',  ', arg2, ...)

// Pattern 1: CONCAT(last_name, ', ', first_name, ' ', COALESCE(middle_name, ''), ' ', COALESCE(ext_name, ''))
content = content.replace(
    /CONCAT\(last_name, ', ', first_name, ' ', COALESCE\(middle_name, ''\), ' ', COALESCE\(ext_name, ''\)\)/g,
    "last_name || ', ' || first_name || ' ' || COALESCE(middle_name || ' ', '') || COALESCE(ext_name, '')"
);

// Pattern 2: CONCAT(last_name, ', ', first_name, ' ', COALESCE(middle_name, ''))
content = content.replace(
    /CONCAT\(last_name, ', ', first_name, ' ', COALESCE\(middle_name, ''\)\)/g,
    "last_name || ', ' || first_name || ' ' || COALESCE(middle_name || '', '')"
);

// Pattern 2b: CONCAT(s.last_name, ', ', s.first_name, ' ', COALESCE(s.middle_name, ''))
content = content.replace(
    /CONCAT\(s\.last_name, ', ', s\.first_name, ' ', COALESCE\(s\.middle_name, ''\)\)/g,
    "s.last_name || ', ' || s.first_name || ' ' || COALESCE(s.middle_name || '', '')"
);

// Pattern 2c: CONCAT(s.last_name, ', ', s.first_name, ' ', COALESCE(s.middle_name,''))
content = content.replace(
    /CONCAT\(s\.last_name, ', ', s\.first_name, ' ', COALESCE\(s\.middle_name,''\)\)/g,
    "s.last_name || ', ' || s.first_name || ' ' || COALESCE(s.middle_name || '', '')"
);

// Pattern 3: CONCAT(first_name, ' ', middle_name, ' ', last_name)
content = content.replace(
    /CONCAT\(first_name, ' ', middle_name, ' ', last_name\)/g,
    "first_name || ' ' || middle_name || ' ' || last_name"
);

// Pattern 3b: CONCAT(s.first_name, ' ', s.middle_name, ' ', s.last_name)
content = content.replace(
    /CONCAT\(s\.first_name, ' ', s\.middle_name, ' ', s\.last_name\)/g,
    "s.first_name || ' ' || s.middle_name || ' ' || s.last_name"
);

// Pattern 4: CONCAT(first_name, ' ', last_name)
content = content.replace(
    /CONCAT\(first_name, ' ', last_name\)/g,
    "first_name || ' ' || last_name"
);

// Pattern 4b: CONCAT(t.first_name, ' ', t.last_name)
content = content.replace(
    /CONCAT\(t\.first_name, ' ', t\.last_name\)/g,
    "t.first_name || ' ' || t.last_name"
);

// Pattern 5: CONCAT(last_name, ', ', first_name)
content = content.replace(
    /CONCAT\(last_name, ', ', first_name\)/g,
    "last_name || ', ' || first_name"
);

// Pattern 5b: CONCAT(t.last_name, ', ', t.first_name)
content = content.replace(
    /CONCAT\(t\.last_name, ', ', t\.first_name\)/g,
    "t.last_name || ', ' || t.first_name"
);

// Pattern 6: CONCAT(s.last_name, ', ', s.first_name, ' ', COALESCE(s.middle_name, ''), ' ', COALESCE(s.ext_name, ''))
content = content.replace(
    /CONCAT\(s\.last_name, ', ', s\.first_name, ' ', COALESCE\(s\.middle_name, ''\), ' ', COALESCE\(s\.ext_name, ''\)\)/g,
    "s.last_name || ', ' || s.first_name || ' ' || COALESCE(s.middle_name || ' ', '') || COALESCE(s.ext_name, '')"
);

// Pattern 7: CONCAT(s.last_name, ', ', s.first_name)
content = content.replace(
    /CONCAT\(s\.last_name, ', ', s\.first_name\)/g,
    "s.last_name || ', ' || s.first_name"
);

// Pattern 8: CONCAT(er.last_name, ', ', er.first_name, ' ', COALESCE(er.middle_name, ''), ' ', COALESCE(er.ext_name, ''))
content = content.replace(
    /CONCAT\(er\.last_name, ', ', er\.first_name, ' ', COALESCE\(er\.middle_name, ''\), ' ', COALESCE\(er\.ext_name, ''\)\)/g,
    "er.last_name || ', ' || er.first_name || ' ' || COALESCE(er.middle_name || ' ', '') || COALESCE(er.ext_name, '')"
);

// Pattern 9: CONCAT(er.last_name, ', ', er.first_name)
content = content.replace(
    /CONCAT\(er\.last_name, ', ', er\.first_name\)/g,
    "er.last_name || ', ' || er.first_name"
);

// Pattern 10: CONCAT(first_name, ' ', COALESCE(middle_name || ' ', ''), last_name, COALESCE(' ' || ext_name, ''))
content = content.replace(
    /CONCAT\(first_name, ' ', COALESCE\(middle_name \|\| ' ', ''\), last_name, COALESCE\(' ' \|\| ext_name, ''\)\)/g,
    "first_name || ' ' || COALESCE(middle_name || ' ', '') || last_name || COALESCE(' ' || ext_name, '')"
);

fs.writeFileSync('./server.js', content, 'utf8');
console.log('✅ Replaced all remaining CONCAT functions with PostgreSQL || operator');

