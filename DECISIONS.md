## Store the JWT in local storage or httponly cookie

The claude suggests using local storage for the scope, but I pushed back becuase the insecurity problem. Afterwards, I chose httpOnly Cookie, which immunes to XSS since JS can't read it and fits in this scope.
