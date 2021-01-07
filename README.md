# @anchor-logoot/listdocumentmodel

This is an implementation of the AnchorLogoot algorithm from which the
organization derives its name. I'm working on some good documentation about the
actual algorithm itself, but in the mean time, it's undocumented. The actual
datatype this represents is an ordered list that allows duplications. To create
a document, simply create an instance of the `ListDocumentModel` class.

## Design Philosophy
This algorithm, in contrast to others such as
[Automerge](https://github.com/automerge/automerge) or
[Y.js](https://github.com/yjs/yjs) is both data *and* network agnostic. This
means that the `ListDocumentModel` contained here can be used for any ordered
list that allows duplication, such as a `string`, array, or a rich text data
type. This *does* mean that it's up to you to perform operations on whatever
your data model is, but it's quite easy. However, if you want to save the state
(in IndexedDB or wherever), you will have to implement this yourself. If you
are interested in using this in your own project, **please submit an issue to
request that I clear up the documentation.** I'm focusing on making the Nodepad
work, so docs here are not at the top of my priority list.

This codebase was forked out of
[Matrix Notepad](https://matrix-notepad.kb1rd.net) and, shortly thereafter,
converted to TypeScript. This is by far the most complex and important part of
the Notepad.

The `ListDocumentModel` contains a mapping of Logootish (custom algorithm)
positions to text positions in the local document. It is capable of
bi-directional mappings. The Logoot equivalent of a local insertion is
determined through the `insertLocal` method and the Logoot equivalent of a
local removal is determined through the `removeLocal` function. The local
operations that must be performed for a given Logoot operation are determined
by the `insertLogoot` and `removeLogoot` methods, respectively.

Conflict resolution is mostly implemented, but there's a few bugs. As soon as
those are ironed out, it's ready to go. There will still be performance
improvements necessary, though.

## Development

```bash

# Install deps
yarn

# Check types
yarn run check-types

# Just lint
yarn run lint

# Build for production (and lint)
yarn run build

# Build jsdoc
yarn run build:docs

# Test
yarn run test

# Test with auto reloads
yarn run test:watch

# Get test coverage
yarn run test:cover

```
