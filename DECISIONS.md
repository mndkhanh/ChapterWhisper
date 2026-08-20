## 1. Store the JWT in local storage or httponly cookie

The claude suggests using local storage for the scope, but I pushed back becuase the insecurity problem. Afterwards, I chose httpOnly Cookie, which immunes to XSS since JS can't read it and fits in this scope.

## 2. Default Fail-Safe Preset Art Styles: apply it or not

I see in the app-demo.html there is no pre-defined art style selection for the chapter illustration. AI coding agent chose built-in art styles for user to choose. With some hesitations, I decided to give users pre-given art styles in order to improve UX though. (this decision incrse the number of steps from 5 to 6 as well, the extra is for project definition)

## 3. Regeneration of the old step (which has been done)

AI have just created the smooth pipeline from 0-5, and it enables the feature of regeneration for old steps which might be in "done" status before. With current scope, I chose no regeneration for convenience and less complex for testing and developing.
