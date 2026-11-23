# Additions of Map Jr. GL

This fork of the MapLibre style specification adds three things that styles for Map Jr. GL use. A style that has one of
the two keys of `metadata` is still valid for MapLibre GL JS, which ignores the keys. MapLibre GL JS reports an error
for an `image` expression with `params` (`"Expected two arguments."`), so a style that uses `params` works in Map Jr. GL
only.

| Addition | Belongs to | What it does |
|---|---|---|
| [`metadata["map-jr:images"]`](#metadatamap-jrimages) | the style | Gives the images of the style by name. |
| [`metadata["map-jr:ssr"]`](#metadatamap-jrssr) | a layer | Changes the layer for the server renderer. |
| [`params` of the `image` expression](#params-of-the-image-expression) | a layer property | Fills the slots of an SVG template image. |

## `metadata["map-jr:images"]`

`map-jr:images` is a key of the `metadata` of the style. Its value is an object of images by name. An `icon-image` refers to an image
by that name.

Each value is one of these:

- an SVG document, as a string;
- the URL of an image, as a string;
- an object with such a string as `image`, and optional `width` and `height` in CSS pixels.

An image of `map-jr:images` wins over the sprite image of the same name. An SVG document with slots (`{{name}}`) is a
template, and the [`params` of the `image` expression](#params-of-the-image-expression) fill its slots.

Map Jr. GL leaves out an image and reports an error in these cases:

- the style has more than 500 images;
- the string of one image is longer than 200,000 characters;
- the value is not a string or an object with a string as `image`;
- an SVG document refers to another file (an `href` or a `url()` that is not `#...` or `data:`).

When the value of `map-jr:images` is not an object, Map Jr. GL uses none of the images and reports an error.

```json
{
  "version": 8,
  "metadata": {
    "map-jr:images": {
      "station": "<svg viewBox=\"0 0 20 20\"><circle cx=\"10\" cy=\"10\" r=\"8\" fill=\"#0b6e4f\"/></svg>",
      "station-large": {
        "image": "<svg viewBox=\"0 0 20 20\"><circle cx=\"10\" cy=\"10\" r=\"8\" fill=\"#0b6e4f\"/></svg>",
        "width": 30,
        "height": 30
      }
    }
  },
  "sources": {},
  "layers": []
}
```

## `metadata["map-jr:ssr"]`

`map-jr:ssr` is a key of the `metadata` of a layer. It changes the layer for the server renderer of Map Jr. GL. The map
in the browser ignores the key.

| Field | Type | Default | Description |
|---|---|---|---|
| `hidden` | `boolean` | `false` | Leaves the layer out of the server render. |
| `filter` | filter expression | | A filter that a feature must also pass. `["zoom"]` is the zoom of the render, as in a layer filter. |
| `minzoom` | `number` | the `minzoom` of the layer | Replaces the `minzoom` of the layer. |
| `maxzoom` | `number` | the `maxzoom` of the layer | Replaces the `maxzoom` of the layer. |
| `paint` | object | | Paint properties. Each replaces the property of the same name of the layer, and the others stay. |
| `layout` | object | | Layout properties. Each replaces the property of the same name of the layer, and the others stay. |
| `simplify` | `number` | `0.6` | Drops vertices that are closer together than this many pixels. |
| `minSize` | `number` | `0.8` | Drops features that are smaller than this many pixels. |

The tiles cut a line into many short pieces, and `minSize` tests each piece on its own. A large `minSize` on a line
layer leaves gaps in the lines.

```json
{
  "version": 8,
  "sources": {
    "openmaptiles": {"type": "vector", "url": "https://tiles.openfreemap.org/planet"}
  },
  "layers": [
    {
      "id": "building",
      "type": "fill",
      "source": "openmaptiles",
      "source-layer": "building",
      "metadata": {"map-jr:ssr": {"hidden": true}}
    }
  ]
}
```

## `params` of the `image` expression

`params` is an option of the `image` expression, in a property of a layer such as `icon-image`. It gives a value for
each slot of an SVG template image, by slot name. Each value is an expression, so each feature can fill a slot from its
properties. The template is an image with slots (`{{color}}`), from `metadata["map-jr:images"]` of the style or added
by the application.

The third argument of `image` is an object, and `params` is its only key. The value of `params` is an object of
expressions by slot name. The validator of this fork reports an error for any other form. MapLibre GL JS accepts no
third argument and reports the error `Expected two arguments.` for the expression.

```json
{
  "version": 8,
  "metadata": {
    "map-jr:images": {
      "pin": "<svg viewBox=\"0 0 20 20\"><circle cx=\"10\" cy=\"10\" r=\"8\" fill=\"{{color}}\"/></svg>"
    }
  },
  "sources": {
    "places": {
      "type": "geojson",
      "data": {
        "type": "Feature",
        "properties": {"color": "#0b6e4f"},
        "geometry": {"type": "Point", "coordinates": [-74.006, 40.7128]}
      }
    }
  },
  "layers": [
    {
      "id": "places",
      "type": "symbol",
      "source": "places",
      "layout": {"icon-image": ["image", "pin", {"params": {"color": ["get", "color"]}}]}
    }
  ]
}
```
