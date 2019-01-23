A local copy of https://github.com/jspm/registry which has unnecessary files removed.

This is is necessary in order to prevent jspm performing a remote call to github in order to retrieve the repository.

Note, this git repository is consumed by jspm performing `git clone --depth=1`, so it is necessary for it to be converted to
a .git repository during the initial build of the console.
