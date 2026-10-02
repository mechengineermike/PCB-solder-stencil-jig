# PCB Stencil Holder Generator

A browser-based generator for making a custom 3D-printable PCB tray. The tray works with the included stencil-holder hardware to keep a board and solder stencil aligned during paste application.

**Live tool:** <https://mechengineermike.github.io/SolderStencilPCBHolder/>

![PCB Stencil Holder Generator](screenshot.png)

## Use it

1. Enter the finished width, height, and thickness of the PCB.
2. Select a clearance value that suits your printer.
3. Download the generated tray STL.
4. Download and print the static holder files once.

The model is generated entirely in the browser; no files or dimensions are uploaded. Boards from 5–100 mm in width and height are supported. A blank STEP template is included for non-rectangular designs.

## Run locally

The app has no build step. Because the viewer loads ES modules and local STL files, serve the directory over HTTP rather than opening `index.html` directly. For example:

```sh
python -m http.server 8000
```

Then open <http://localhost:8000>.

## GitHub Pages

In the repository settings, select **Pages → Deploy from a branch**, then choose the root of the default branch. The included `.nojekyll` file lets GitHub Pages serve the static app as-is.

## Credits

- Original holder design: [Michael Graham / mechengineermike](https://github.com/mechengineermike)
- Initial browser generator: Curly Tale Games LLC
- Current interface and maintenance: Michael Graham

## License

Released under the [MIT License](LICENSE).

## What it makes

The generator creates the PCB-sized center tray used with the printable hinge, frame, and feet from the original [Solder Stencil PCB Jig project on Thingiverse](https://www.thingiverse.com/thing:6313798).

| Original printed jig | Browser tray generator |
| --- | --- |
| [![The assembled Solder Stencil PCB Jig holding a PCB and stencil](img/original-solder-stencil-jig.jpg)](https://www.thingiverse.com/thing:6313798) | [![The PCB Stencil Holder Generator interface](screenshot.png)](https://mechengineermike.github.io/SolderStencilPCBHolder/) |

*Original project photo by Michael Graham, from [Thingiverse thing:6313798](https://www.thingiverse.com/thing:6313798).*
