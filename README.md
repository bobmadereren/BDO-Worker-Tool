# Black Desert Worker Tool

Tool to help with node investment, house investment and workers in Black Desert.

## Development

### Install Dependencies

```
  npm install
```

### Run Dev Server

```
  npm run dev
```

### Build
Bundle the project into the dist folder.

```
  npm run build
```

### Import Node Data
Import up-to-data node data into the project.

```
  npm run import-nodes
```

### Reset Config
Build default user configuration. Any existing config will be overridden.

```
  npm run reset-config
```

## TODO
- [ ] Ability to sell node (including dependent nodes and edges which should be shown and highlighted when hovering node or sell button)
- [ ] Save owned nodes
- [ ] Animate side panel in and out
- [ ] Update dimensions on window size change
- [ ] Refactor components: svg, tooltip, sidepanel, legend, totalcp into separate files
- [ ] Summary of yield from owned nodes