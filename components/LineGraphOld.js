import React from "react"

import ComponentBase from "./ComponentBase"

import get from "lodash.get"

import d3 from "./d3"

import COLOR_RANGES from "constants/color-ranges"
const DEFAULT_COLORS = COLOR_RANGES[12].reduce((a, c) => c.name === "Set3" ? c.colors : a, []).slice();

const HoverComp = ({ data, idFormat, xFormat, yFormat }) =>
  <table className="table table-sm">
    <thead>
      <tr>
        <th colSpan={ 3 }>{ xFormat(data.x) }</th>
      </tr>
    </thead>
    <tbody>
      {
        data.data.map(({ id, y, color }) =>
          <tr key={ id }>
            <td><div style={ { width: "15px", height: "15px", background: color } }/></td>
            <td>{ idFormat(id) }</td>
            <td>{ yFormat(y) }</td>
          </tr>
        )
      }
    </tbody>
  </table>

export class LineGraph extends ComponentBase {
  static defaultProps = ComponentBase.generateDefaultProps({
    label: "Test Label",
    HoverComp
  })
  static componentType = "line-graph"
  updateComponent() {
    const {
      id,
      svg,
      data,
      width,
      height,
      margin: { top, right, bottom, left },
      yDomain,
      xDomain,
      registerData
    } = this.props;
    if (!Boolean(svg)) return;

    const group = d3.select(this.group.current)
      .style("transform", `translate(${ left }px, ${ top }px)`)

    const xScale = d3.scalePoint()
        .domain(xDomain)
        .range([0, width - left - right])
        .padding(0.5);

		const yScale = d3.scaleLinear()
			.domain(yDomain)
			.range([height - top - bottom, 0]);

		const lineGenerator = d3.line()
			.x(d => xScale(d.x))
			.y(d => yScale(d.y));

    const GET_COLOR = this.getColor.bind(this);

    const lines = group
      .selectAll("path")
        .data(data, d => d.id)
          .join("path")
            .attr("class", "graph-line")
            .attr("d", d => lineGenerator(d.data))
            .attr("fill", "none")
            .attr("stroke", GET_COLOR);

    const lineData = {};
    xDomain.forEach(x => {
      lineData[x] = data.reduce((a, c, i) => {
        return [...a,
          { id: c.id,
            y: c.data.reduce((a, c) => c.x === x ? c.y : a, null),
            color: GET_COLOR(c, i)
          }
        ]
      }, [])
    })

    registerData(id, { type: "line-graph", data: lineData });
  }
}

export const generateTestLineData = (lines = 5, num = 50) => {
  const IDs = d3.range(lines).map(i => `line-${ i + 1 }`);
  const func = (m, i, s) => Math.cos(i * Math.PI + s) * m + m * 1.1;
  return IDs.reduce((data, id, i) => {
    const magnitude = Math.round(Math.random() * 75) + 50,
      start = (Math.round(Math.random() * 10)) / 10,
      numPeriods = Math.round(Math.random() * 2) + 0.5,
      shift = Math.random() * Math.PI * 2;
    return [ ...data,
      { id,
        color: DEFAULT_COLORS.slice().reverse()[i % DEFAULT_COLORS.length],
        data: d3.range(num)
          .map(i => ({ x: `key-${ i }`, y: func(magnitude, start + (i * 2) / (num * (1 / numPeriods)), shift) }))
      }
    ]
  }, [])
}

/*
DATA FORMAT
Array [
  Object { <- One Object Per Line
    id: Unique String,
    color: Optional Valid Color String,
    data: Array [
      Object { <- One Object Per Data Point
        x: Value,
        y: Numeric Value
      },
      Object {
        x: Value,
        y: Numeric Value
      },
      ...
    ]
  },
  ...
]
*/
