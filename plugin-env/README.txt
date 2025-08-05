plugin-env
=============

This is the directory where Pi-Tray loads its plugins from. It is intentionally listed in the .gitignore so that
users can add their own plugins without having to worry about committing them to the repository.

You should ensure you install plugins in this directory, not the root of the repository.

Ideally, we wouldn't have to do this, but installing npm modules with --no-save would lose the module when you
next run npm install.

For maintainers: if you have genuine reason to update this directory (e.g. to update the builtin plugins), you can force
git to track this directory for a single commit by running the following command:

git add -f plugin-env/file

Do NOT force add the whole directory, as this will commit node_modules!
