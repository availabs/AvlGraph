import React from "react"

import ComponentBase, { getColorFunc, getUniqueId } from "./ComponentBase"
import DataManager from "./DataManager"

import get from "lodash.get"
// import deepequal from "deep-equal"
// import styled from "styled-components"
import classnames from "classnames"

import d3 from "./d3"

const HoverComp = ({ data, idFormat, xFormat, yFormat, secondary }) =>
  <table className={ classnames("hover-table", { secondary }) }>
    <thead>
      <tr><th colSpan="3">{ xFormat(data.x) }</th></tr>
    </thead>
    <tbody>
      {
        Object.keys(data.data)
          .map(id =>
            <tr key={ id }>
              <td>
                <div className="color-square"
                  style={ {
                    width: "14px",
                    height: "14px",
                    color: data.colors[id]
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
    getDomainY,
    plotPoints: false
  })
  static getDerivedStateFromProps(props, state) {
    const { id } = state;

    let {
      data,
      width,
      height,
      margin: { top, right, bottom, left },
      // keys,
      yDomain,
      xDomain,
      registerData,
      secondary,
      padding,
      plotPoints
    } = props;

    const {
      // entering,
      // updating,
      exiting
    } = props;

    if (width === 0 || height === 0) return null;

    const adjustedWidth = Math.max(0, width - left - right),
      adjustedHeight = Math.max(0, height - top - bottom);

    const xScale = d3.scalePoint()
        .domain(xDomain)
        .range([0, adjustedWidth])
        .padding(padding);

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

    const exitingPoints = state.pointsData.filter(({ id }) => (id in exiting))
      .map(d => ({ ...d, state: "exiting" }));

    const getColor = getColorFunc(props);

    const sliceData = xDomain.reduce((a, c) => (a[c] = { x: c, data: {}, colors: {} }, a), {});

    const pointsData = [];

    const lineData = data.map((d, i) => {
      const color = getColor(d, i);
      d.data.forEach(dd => {
        plotPoints && pointsData.push({
          cx: xScale(dd.x),
          cy: yScale(dd.y),
          id: d.id,
          enter: yScale(yDomain[0]),
          color
        });
        sliceData[dd.x].data[d.id] = dd.y;
        sliceData[dd.x].colors[d.id] = color;
      })
      const data = {
        id: d.id,
        d: lineGenerator(d.data),
        color,
        enterPath,
        secondary
      }
      return data;
    })

    registerData(id, sliceData, "line-graph", props);

    return {
      lineData: [...lineData, ...exitingData],
      pointsData: [...pointsData, ...exitingPoints],
      sliceData
    };
  }

  state = {
    id: getUniqueId(),
    lineData: [],
    sliceData: {},
    pointsData: [],
    xpos: 0,
    showHoverComp: false
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
        transitionTime,
        xDomain,
        margin: { top, right, bottom, left },
        height,
        width,
        padding
      } = this.props;

    const adjustedWidth = width - left - right,
      adjustedHeight = height - top - bottom,
      xScale = d3.scalePoint()
        .domain(xDomain)
        .range([0, adjustedWidth])
        .padding(padding);
    const {
      showHoverComp,
      sliceData
    } = this.state;
    return (
      <g onMouseLeave={ e => this.onMouseLeave(e) }>
        { xDomain.map((x, i) =>
            <rect key={ x }
              height={ adjustedHeight }
              width={ xScale.step() }
              x={ i * xScale.step() }
              fill="transparent"
              onMouseEnter={ e => this.onMouseEnter(e, x, xScale(x), sliceData[x]) }
              onMouseMove={ e => this.onMouseMove(e, x, xScale(x), sliceData[x]) }/>
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
    const {
      margin: { top, left },
      handleInteractions
    } = this.props;

    return (
      <g style={ { transform: `translate(${ left }px, ${ top }px)` } }>
        { this.state.lineData.map(d => <Line key={ d.id } { ...d }/>) }
        { this.state.pointsData.map(p => <Point key={ `${ p.id }-${ p.cx }` } { ...p }/>) }
        { handleInteractions && this.renderInteractiveLayer() }
      </g>
    )
  }
}
export const LineGraph = DataManager(LineGraphBase, "id");

class Point extends React.PureComponent {
  ref = React.createRef()
  componentDidMount() {
    const { cx, cy, color, enter } = this.props;
    d3.select(this.ref.current)
      .attr("cx", cx)
      .attr("cy", enter)
      .attr("r", 0)
      .attr("fill", color)
      .transition().duration(1000)
      .attr("cy", cy)
      .attr("r", 4);
  }
  componentDidUpdate() {
    const { cy, color, state, enter } = this.props;
    if (state === "exiting") {
      d3.select(this.ref.current)
        .transition().duration(1000)
        .attr("r", 0)
        .attr("cy", enter);
    }
    else {
      d3.select(this.ref.current)
        .transition().duration(1000)
        .attr("fill", color)
        .attr("cy", cy);
    }
  }
  render() {
    return <circle ref={ this.ref }/>
  }
}

class Line extends React.PureComponent {
  ref = React.createRef()
  componentDidMount() {
    const { d, color, enterPath } = this.props;
    d3.select(this.ref.current)
      .attr("d", enterPath)
      .transition().duration(1000)
      .attr("d", d)
      .attr("stroke", color);
  }
  componentDidUpdate() {
    const { d, color, state, enterPath } = this.props;
    if (state === "exiting") {
      d3.select(this.ref.current)
        .transition().duration(1000)
        .attr("d", enterPath);
    }
    else {
      d3.select(this.ref.current)
        .transition().duration(1000)
        .attr("d", d)
        .attr("stroke", color);
    }
  }
  render() {
    const {
      // d,
      // color,
      secondary
    } = this.props;
    return (
      <path ref={ this.ref }
        className={ classnames("graph-line", { secondary }) }
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
