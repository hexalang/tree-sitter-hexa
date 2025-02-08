# Tree-sitter parser for Hexa

Based on https://github.com/Rileran/tree-sitter-actionscript

## Development

### Setup

```bash
yarn install
```

### Build

```bash
yarn build
```

Then you can parse a file using

```bash
yarn tree-sitter parse test.hexa
```

### Testing

There is a corpus of test in [the test directory](test/corpus/).

To run the grammar against the corpus use:

```bash
yarn test
# OR, to build then test
yarn build-test
```

