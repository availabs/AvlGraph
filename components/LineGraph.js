import React from "react"

import ComponentBase, { getColorFunc, getUniqueId } from "./ComponentBase"
import DataManager from "./DataManager"

import get from "lodash.get"
import deepequal from "deep-equal"
import styled from "styled-components"

import d3 from "./d3"

const HoverComp = ({ data, idFormat, xFormat, yFormat, secondary }) =>
  <table className="table table-sm">
    <thead>
      <tr><th colSpan="3">{ xFormat(data.x) }</th></tr>
    </thead>
    <tbody>
      {
        Object.keys(data.data)
          .map(id =>
            <tr key={ id }>
              <td>
                <div style={ {
                  width: "14px",
                  height: "14px",
                  background:
                    secondary ? `repeating-linear-gradient(90deg, ${ data.colors[id] }, ${ data.colors[id] } 2px, #fff 2px, #fff 4px)`
                    : data.colors[id]
                } }/>
              </td>
              <td>{ idFormat(id) }</td>
              <td>{ yFormat(data.data[id]) }</td>
            </tr>
          )
      }
    </tbody>
  </table>,

  getDomainX = data => data.length ? get(data, '[0].data', []).map(d => d.x) : null,
  getDomainY = data => {
    if (!data.length) return null;
    return d3.extent(data.reduce((a, c) => [...a, ...c.data.map(d => d.y)], []));
  };

class LineGraphBase extends ComponentBase {
  static defaultProps = ComponentBase.generateDefaultProps({
    HoverComp,
    keys: [],
    getDomainX,
    getDomainY
  })
  static getDerivedStateFromProps(props, state) {
    const { id } = state;

    let {
      data,
      width,
      height,
      margin: { top, right, bottom, left },
      keys,
      yDomain,
      xDomain,
      registerData,
      secondary = false
    } = props;

    const {
      entering,
      updating,
      exiting
    } = props;

    if (width === 0 || height === 0) return null;

    const adjustedWidth = Math.max(0, width - left - right),
      adjustedHeight = Math.max(0, height - top - bottom);

    const xScale = d3.scalePoint()
        .domain(xDomain)
        .range([0, adjustedWidth])
        .padding(0.5);

		const yScale = d3.scaleLinear()
			.domain(yDomain)
			.range([adjustedHeight, 0]);

		const lineGenerator = d3.line()
			.x(d => xScale(d.x))
			.y(d => yScale(d.y));

		const yEnter = yScale(yDomain[0]),
      enterGenerator = d3.line()
  			.x(d => xScale(d))
  			.y(d => yEnter);
    const enterPath = enterGenerator(xDomain)

    const exitingData = state.lineData.filter(({ id }) => (id in exiting))
      .map(d => ({ ...d, state: "exiting" }));

    const getColor = getColorFunc(props);

    const sliceData = xDomain.reduce((a, c) => (a[c] = { x: c, data: {}, colors: {} }, a), {});

    const lineData = data.map((d, i) => {
      d.data.forEach(dd => {
        sliceData[dd.x].data[d.id] = dd.y;
        sliceData[dd.x].colors[d.id] = getColor(d, i);
      })
      const data = {
        id: d.id,
        d: lineGenerator(d.data),
        color: getColor(d, i),
        enterPath,
        secondary
      }
      return data;
    })

    registerData(id, sliceData, "line-graph", props);

    return { lineData: [...lineData, ...exitingData], sliceData };
  }
  constructor(props) {
    super(props);

    this.state = {
      id: getUniqueId(),
      lineData: [],
      sliceData: {},
      xpos: 0,
      showHoverComp: false
    };

    this.onMouseEnter = this.onMouseEnter.bind(this);
    this.onMouseMove = this.onMouseMove.bind(this);
    this.onMouseLeave = this.onMouseLeave.bind(this);
  }
  onMouseEnter(e, x, xpos, data) {
    this.setState({ showHoverComp: true, xpos });
    this.props.onMouseEnter(e, x, xpos, this.props.id, data);
  }
  onMouseMove(e, x, xpos, data) {
    this.props.onMouseMove(e, x, xpos, this.props.id, data)
  }
  onMouseLeave(e) {
    this.setState({ showHoverComp: false });
    this.props.onMouseLeave(e);
  }
  renderInteractiveLayer() {
    const {
        handleInteractions,
        transitionTime,
        xDomain,
        margin: { top, right, bottom, left },
        height,
        width
      } = this.props,
      adjustedWidth = width - left - right,
      adjustedHeight = height - top - bottom,
      xScale = d3.scalePoint()
        .domain(xDomain)
        .range([0, adjustedWidth])
        .padding(0.5);
    const {
      showHoverComp,
      sliceData
    } = this.state;
    return (
      <g onMouseLeave={ handleInteractions ? this.onMouseLeave : null }>
        { xDomain.map((x, i) =>
            <rect key={ x }
              height={ adjustedHeight }
              width={ xScale.step() }
              x={ i * xScale.step() }
              fill="transparent"
              onMouseEnter={ handleInteractions ? e => this.onMouseEnter(e, x, xScale(x), sliceData[x]) : null }
              onMouseMove={ handleInteractions ? e => this.onMouseMove(e, x, xScale(x), sliceData[x]) : null }/>
          )
        }
        { !showHoverComp ? null :
          <line y2={ adjustedHeight }
            style={ {
              transform: `translateX(${ this.state.xpos + 0.5 }px)`,
              transition: `transform ${ transitionTime }s`
            } }
            stroke="#000"
            strokeWidth="1"
            pointerEvents="none"/>
        }
      </g>
    );
  }
  render() {
    const { margin: { top, right, bottom, left } } = this.props;

    return (
      <g style={ { transform: `translate(${ left }px, ${ top }px)` } }>
        {
          this.state.lineData.map(d => <Line key={ d.id } { ...d }/>)
        }
        { this.renderInteractiveLayer() }
      </g>
    )
  }
}
export const LineGraph = DataManager(LineGraphBase, "id");
// export const BarGraph = BarGraphBase;

class Line extends React.PureComponent {
  ref = React.createRef()
  componentDidMount() {
    const { d, color, enterPath, secondary } = this.props;
    d3.select(this.ref.current)
      .attr("d", enterPath)
      .transition().duration(1000)
      .attr("d", d)
      .attr("stroke", color)
      .attr("stroke-dasharray", secondary ? "4 4" : null)
  }
  componentDidUpdate() {
    const { d, color, state, enterPath, secondary } = this.props;
    if (state === "exiting") {
      d3.select(this.ref.current)
        .transition().duration(1000)
        .attr("d", enterPath);
    }
    else {
      d3.select(this.ref.current)
        .transition().duration(1000)
        .attr("d", d)
        .attr("stroke", color)
        .attr("stroke-dasharray", secondary ? "4 4" : null);
    }
  }
  render() {
    const {
      d,
      color
    } = this.props;
    return (
      <path ref={ this.ref }
        className="graph-line"
        fill="none"
        strokeWidth="2"/>
    )
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
        data: d3.range(num)
          .map(i => ({ x: `key-${ i }`, y: func(magnitude, start + (i * 2) / (num * (1 / numPeriods)), shift) }))
      }
    ]
  }, [])
}
