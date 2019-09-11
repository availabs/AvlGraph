import * as d3array from "d3-array"
import * as d3selection from "d3-selection"
import * as d3multi from "d3-selection-multi"
import * as d3scale from "d3-scale"
import * as d3axis from "d3-axis"
import * as d3transition from "d3-transition"
import * as d3format from "d3-format"
import * as d3shape from "d3-shape"
import * as d3ease from "d3-ease"

const d3 = {
  ...d3array,
  ...d3selection,
  ...d3scale,
  ...d3axis,
  ...d3transition,
  ...d3format,
  ...d3shape,
  ...d3ease
}

export default d3;
